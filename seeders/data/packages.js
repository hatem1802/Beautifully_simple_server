/**
 * Packages reference subjects by name; the seeder resolves them to ObjectIds.
 */
const packages = [
  {
    name: "Frontend Starter",
    description: "HTML and CSS together for one month.",
    subjectNames: ["HTML Fundamentals", "CSS Styling"],
    price: 300,
    durationDays: 30,
  },
  {
    name: "Full Web Basics",
    description: "The three basics in one package.",
    subjectNames: ["HTML Fundamentals", "CSS Styling", "JavaScript Basics"],
    price: 500,
    durationDays: 60,
  },
];

export { packages };
