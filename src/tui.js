import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

const API_URL = (process.env.API_URL || "http://localhost:1234").replace(
  /\/$/,
  "",
);

const rl = readline.createInterface({ input, output });

function clearScreen() {
  process.stdout.write("\x1Bc");
}

function title(text) {
  console.log(`\n${text}`);
  console.log("=".repeat(text.length));
}

function pause() {
  return rl.question("\nPress Enter to continue...");
}

async function ask(label) {
  return (await rl.question(`${label}: `)).trim();
}

async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });

  let body;
  try {
    body = await response.json();
  } catch {
    body = {
      success: false,
      message: `Unexpected non-JSON response (${response.status})`,
    };
  }

  if (!response.ok) {
    const error = new Error(body.message || "Request failed");
    error.statusCode = response.status;
    error.body = body;
    throw error;
  }

  return body;
}

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function printResult(body) {
  console.log(`\n${body.message}`);
  if (body.data) {
    console.log(JSON.stringify(body.data, null, 2));
  }
}

function printError(error) {
  const status = error.statusCode ? ` (${error.statusCode})` : "";
  console.log(`\nError${status}: ${error.message}`);
  if (error.cause?.code === "ECONNREFUSED") {
    console.log(`Start the API first: npm start`);
    console.log(`Current API URL: ${API_URL}`);
  }
}

function printEvents(events) {
  if (events.length === 0) {
    console.log("\nNo events found.");
    return;
  }

  const rows = events.map((event) => ({
    ID: event.event_id,
    Name: event.name,
    Date: formatDate(event.event_date),
    Seats: `${event.available_seats}/${event.total_seats}`,
    Registrations: event.total_registrations,
  }));

  console.table(rows);
}

async function healthCheck() {
  clearScreen();
  title("Health Check");

  try {
    const body = await apiRequest("/health");
    printResult(body);
  } catch (error) {
    printError(error);
  }

  await pause();
}

async function viewEvents() {
  clearScreen();
  title("View Events");

  const sort = (await ask("Sort by date? (y/N)")).toLowerCase() === "y";
  const upcoming = (await ask("Upcoming only? (y/N)")).toLowerCase() === "y";
  const params = new URLSearchParams();

  if (sort) params.set("sort", "date");
  if (upcoming) params.set("upcoming", "true");

  const query = params.toString();

  try {
    const body = await apiRequest(`/events${query ? `?${query}` : ""}`);
    printEvents(body.data);
  } catch (error) {
    printError(error);
  }

  await pause();
}

async function createEvent() {
  clearScreen();
  title("Create Event");

  const name = await ask("Event name");
  const totalSeats = Number.parseInt(await ask("Total seats"), 10);
  const eventDate = await ask("Event date (ISO or YYYY-MM-DD)");

  try {
    const body = await apiRequest("/events", {
      method: "POST",
      body: JSON.stringify({
        name,
        total_seats: totalSeats,
        event_date: eventDate,
      }),
    });
    printResult(body);
  } catch (error) {
    printError(error);
  }

  await pause();
}

async function registerUser() {
  clearScreen();
  title("Register User");

  const eventId = await ask("Event ID");
  const userName = await ask("User name");

  try {
    const body = await apiRequest(`/events/reg/${eventId}`, {
      method: "POST",
      body: JSON.stringify({ user_name: userName }),
    });
    printResult(body);
  } catch (error) {
    printError(error);
  }

  await pause();
}

async function cancelRegistration() {
  clearScreen();
  title("Cancel Registration");

  const registrationId = await ask("Registration ID");

  try {
    const body = await apiRequest(`/events/reg/${registrationId}`, {
      method: "DELETE",
    });
    printResult(body);
  } catch (error) {
    printError(error);
  }

  await pause();
}

async function mainMenu() {
  while (true) {
    clearScreen();
    title("Event Registration API");
    console.log(`API: ${API_URL}\n`);
    console.log("1. Health check");
    console.log("2. View events");
    console.log("3. Create event");
    console.log("4. Register user");
    console.log("5. Cancel registration");
    console.log("0. Exit");

    const choice = await ask("\nChoose an option");

    if (choice === "0") break;
    if (choice === "1") await healthCheck();
    else if (choice === "2") await viewEvents();
    else if (choice === "3") await createEvent();
    else if (choice === "4") await registerUser();
    else if (choice === "5") await cancelRegistration();
    else {
      console.log("\nInvalid option.");
      await pause();
    }
  }
}

try {
  await mainMenu();
} finally {
  rl.close();
}
