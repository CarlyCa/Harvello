export type VolunteerSignup = {
  id: string;
  title: string;
  organization: string;
  startsAt: string;
  endsAt: string;
  status: "registered" | "cancelled";
};

export function getVolunteerHours(signups: VolunteerSignup[], now = new Date()) {
  return signups.reduce(
    (totals, signup) => {
      if (signup.status !== "registered") return totals;

      const start = new Date(signup.startsAt);
      const end = new Date(signup.endsAt);
      const hours = Math.max(0, end.getTime() - start.getTime()) / 3_600_000;

      if (end <= now) totals.volunteered += hours;
      else totals.signedUp += hours;

      return totals;
    },
    { volunteered: 0, signedUp: 0 }
  );
}

export function formatOpportunityDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}
