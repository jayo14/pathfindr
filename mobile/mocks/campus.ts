import { Building, CampusEvent, LostItemReport } from "@/types/domain";

export const campusBuildings: Building[] = [
  {
    id: "ict-center",
    name: "ICT Innovation Centre",
    code: "ICT",
    category: "facility",
    coordinate: { latitude: 6.4672, longitude: 3.5951 },
    description:
      "A modern technology hub for digital learning, coding labs, and project support across the campus.",
    imageUrl:
      "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=80",
    tags: ["wifi", "innovation", "coding"],
    departments: ["Computer Science Support Desk"],
    facilities: ["High-speed Wi-Fi", "Digital Lab", "Student Workstations"],
    openingHours: "Mon - Fri · 8:00 AM - 6:00 PM",
  },
  {
    id: "engineering-block",
    name: "School of Engineering Block",
    code: "ENG",
    category: "faculty",
    coordinate: { latitude: 6.4684, longitude: 3.5968 },
    description:
      "Primary hub for engineering lectures, faculty offices, and student project reviews.",
    imageUrl:
      "https://images.unsplash.com/photo-1511818966892-d7d671e672a2?auto=format&fit=crop&w=1200&q=80",
    tags: ["lectures", "faculty", "workshops"],
    departments: ["Mechanical Engineering", "Electrical Engineering"],
    facilities: ["Lecture Hall", "Project Studio", "Faculty Lounge"],
    openingHours: "Mon - Sat · 8:00 AM - 5:00 PM",
  },
  {
    id: "library-complex",
    name: "Knowledge Resource Library",
    code: "LIB",
    category: "library",
    coordinate: { latitude: 6.4661, longitude: 3.5979 },
    description:
      "Quiet reading floors, digital archives, and research support spaces for the entire campus community.",
    imageUrl:
      "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=1200&q=80",
    tags: ["study", "research", "archive"],
    departments: ["Research Services"],
    facilities: ["Reading Rooms", "E-library", "Research Desk"],
    openingHours: "Daily · 8:00 AM - 8:00 PM",
  },
  {
    id: "admin-tower",
    name: "Administrative Tower",
    code: "ADM",
    category: "admin",
    coordinate: { latitude: 6.4655, longitude: 3.5946 },
    description:
      "Central administrative offices handling records, student affairs, and campus operations.",
    imageUrl:
      "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80",
    tags: ["student affairs", "records", "payments"],
    departments: ["Registry", "Bursary"],
    facilities: ["Reception", "Records Office", "Help Desk"],
    openingHours: "Mon - Fri · 8:30 AM - 4:30 PM",
  },
  {
    id: "science-labs",
    name: "Applied Science Laboratories",
    code: "LAB",
    category: "lab",
    coordinate: { latitude: 6.4676, longitude: 3.5988 },
    description:
      "Specialized teaching labs supporting environmental, biological, and physical science experiments.",
    imageUrl:
      "https://images.unsplash.com/photo-1532187643603-ba119ca4109e?auto=format&fit=crop&w=1200&q=80",
    tags: ["experiments", "lab coats", "practical"],
    departments: ["Applied Sciences"],
    facilities: ["Wet Lab", "Safety Station", "Technician Office"],
    openingHours: "Mon - Fri · 9:00 AM - 5:00 PM",
  },
  {
    id: "student-hub",
    name: "Student Hub & Cafeteria",
    code: "HUB",
    category: "facility",
    coordinate: { latitude: 6.4648, longitude: 3.5961 },
    description:
      "A lively social zone with meal spots, group seating, and support services for students.",
    imageUrl:
      "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=1200&q=80",
    tags: ["food", "community", "relax"],
    departments: ["Student Experience"],
    facilities: ["Cafeteria", "Help Booth", "Group Tables"],
    openingHours: "Daily · 7:30 AM - 7:00 PM",
  },
];

export const campusEvents: CampusEvent[] = [
  {
    id: "innovation-summit",
    title: "Campus Innovation Summit",
    description:
      "Student founders, prototypes, and lightning talks from top campus builders.",
    dateLabel: "Mar 18",
    startTime: "10:00 AM",
    locationName: "ICT Innovation Centre",
    buildingId: "ict-center",
    imageUrl:
      "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80",
    category: "career",
  },
  {
    id: "engineering-showcase",
    title: "Engineering Project Showcase",
    description:
      "Final-year teams present mobility, power, and sustainability solutions.",
    dateLabel: "Mar 21",
    startTime: "1:00 PM",
    locationName: "School of Engineering Block",
    buildingId: "engineering-block",
    imageUrl:
      "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1200&q=80",
    category: "academic",
  },
  {
    id: "sports-fiesta",
    title: "Green Track Sports Fiesta",
    description:
      "Inter-school relays, football highlights, and wellness sessions.",
    dateLabel: "Mar 24",
    startTime: "4:30 PM",
    locationName: "Student Hub & Cafeteria",
    buildingId: "student-hub",
    imageUrl:
      "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=1200&q=80",
    category: "sports",
  },
];

export const lostItemReports: LostItemReport[] = [
  {
    id: "lf-1",
    title: "Black Lenovo Backpack",
    description:
      "Seen near the main entrance with a silver water bottle in the side pocket.",
    status: "found",
    locationName: "Administrative Tower",
    imageUrl:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=80",
    reportedAt: "2 hours ago",
    contactHint: "Drop by Student Affairs desk",
    buildingId: "admin-tower",
  },
  {
    id: "lf-2",
    title: "Scientific Calculator",
    description: "Lost after a practical session. Name sticker reads “Teni O.”",
    status: "lost",
    locationName: "Applied Science Laboratories",
    imageUrl:
      "https://images.unsplash.com/photo-1564466809058-bf4114d55352?auto=format&fit=crop&w=1200&q=80",
    reportedAt: "Yesterday",
    contactHint: "Report at lab technician office",
    buildingId: "science-labs",
  },
  {
    id: "lf-3",
    title: "Student ID Card",
    description: "Found close to the café queue during lunch rush.",
    status: "found",
    locationName: "Student Hub & Cafeteria",
    imageUrl:
      "https://images.unsplash.com/photo-1573496799515-eebbb63814f2?auto=format&fit=crop&w=1200&q=80",
    reportedAt: "Today",
    contactHint: "Collected at PathFindr help point",
    buildingId: "student-hub",
  },
];
