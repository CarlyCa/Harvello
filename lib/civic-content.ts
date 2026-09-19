export type CivicContent = {
  greeting: string;
  introduction: string;
  actions: Array<{ title: string; description: string }>;
  upcomingHeading: string;
  tasksHeading: string;
};

export const defaultCivicContent: CivicContent = {
  greeting: "Good afternoon, Carly",
  introduction: "Your speaking engagements, board service, volunteering and training in one place — plus what needs your attention this week.",
  actions: [
    { title: "Submit a speaking request", description: "Request a Hive Ambassador for an event" },
    { title: "Find a volunteer opportunity", description: "Browse, filter and register" },
    { title: "Nominate a nonprofit", description: "$1,000 quarterly award" }
  ],
  upcomingHeading: "My upcoming activities",
  tasksHeading: "Tasks requiring my attention"
};
