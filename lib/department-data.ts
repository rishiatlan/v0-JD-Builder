// Department options and their associated guardrails

export interface DepartmentGuardrails {
  owns: string[]
  avoid: string[]
}

export interface Department {
  name: string
  value: string
  guardrails: DepartmentGuardrails
}

export const departments: Department[] = [
  {
    name: "Customer Experience",
    value: "customer-experience",
    guardrails: {
      owns: [
        "Customer onboarding, support systems, ticketing, NPS, customer feedback loops",
        "Help center, FAQs, customer comms",
      ],
      avoid: [
        "Product roadmap ownership",
        "Engineering priorities or system design decisions (unless embedded CX-Eng role)",
        "Full ownership of CX tooling without cross-functional input",
      ],
    },
  },
  {
    name: "Engineering",
    value: "engineering",
    guardrails: {
      owns: [
        "System architecture, codebase, infrastructure",
        "Technical implementation, reliability, security (in-product)",
        "Developer experience and platform tooling",
      ],
      avoid: [
        "Product strategy or prioritization (led by PM)",
        "Brand messaging or content",
        "Full accountability for UX unless explicitly paired with Design",
      ],
    },
  },
  {
    name: "Finance",
    value: "finance",
    guardrails: {
      owns: [
        "Budgeting, headcount planning, forecasting, runway, financial modeling (Pigment)",
        "Spend management and procurement oversight",
        "Pricing strategy (in partnership with Product/Marketing)",
      ],
      avoid: [
        "HR policies or performance frameworks",
        "Talent or hiring decisions (beyond cost approvals)",
        "Product roadmap input",
      ],
    },
  },
  {
    name: "Founder's Office",
    value: "founders-office",
    guardrails: {
      owns: [
        "Strategic initiatives, OKR rollouts, culture experiments, special projects",
        "Cross-functional task forces and internal innovation sprints",
      ],
      avoid: [
        "Full-time ownership of core functions (e.g. Sales pipeline, Engineering velocity)",
        "People/talent decisions unless delegated specifically",
      ],
    },
  },
  {
    name: "IT & Security",
    value: "it-security",
    guardrails: {
      owns: [
        "Internal tools (e.g. device management, SSO, provisioning)",
        "Access control, security policies, data privacy compliance (SOC2, ISO, etc.)",
        "Security tooling and incident response",
      ],
      avoid: [
        "In-product security feature roadmap (owned by Eng/PM)",
        "Writing legal contracts or owning regulatory interpretation (Legal-led)",
      ],
    },
  },
  {
    name: "Legal",
    value: "legal",
    guardrails: {
      owns: [
        "Contracts, regulatory compliance, IP, entity governance",
        "Risk mitigation and legal policies across geographies",
      ],
      avoid: ["Performance or HR policies (People-led)", "Procurement ownership (Finance or IT typically lead here)"],
    },
  },
  {
    name: "Marketing",
    value: "marketing",
    guardrails: {
      owns: [
        "Brand voice, messaging, demand generation, social, content strategy",
        "Website and campaign strategy, positioning",
        "Employer brand (in partnership with People)",
      ],
      avoid: [
        "Product delivery or roadmap decisions",
        "Revenue ownership (Sales-led)",
        "HR or cultural responsibilities",
      ],
    },
  },
  {
    name: "People",
    value: "people",
    guardrails: {
      owns: [
        "HR systems (HiBob), compliance, process excellence, benefits, payroll",
        "Global employment transitions, data integrity, audits",
        "Organizational design, leadership coaching, succession planning",
        "Team health and performance enablement",
        "Hiring strategy, pipeline building, Ashby usage, recruiter operations",
        "Candidate experience, offer design (in collab with Finance/People)",
      ],
      avoid: [
        "Employer branding (Marketing/TA-led)",
        "Culture or EVP design (People Partner or Founder's Office-led unless scoped)",
        "System management or global compliance",
        "Talent sourcing or interviewing metrics (TA-owned)",
        "Onboarding program design (HR Ops-led)",
        "Performance review ownership",
      ],
    },
  },
  {
    name: "Product Design",
    value: "product-design",
    guardrails: {
      owns: ["User journeys, wireframes, prototypes, visual systems", "UX research, accessibility, design standards"],
      avoid: ["Technical feasibility calls (Engineering)", "Product strategy prioritization (PM-owned)"],
    },
  },
  {
    name: "Product Management",
    value: "product-management",
    guardrails: {
      owns: [
        "Product strategy, roadmap, feature definition, delivery coordination",
        "Cross-functional product teams, customer needs alignment",
      ],
      avoid: [
        "Design specifics (Design-led), Engineering estimates",
        "Full accountability for GTM or marketing language",
      ],
    },
  },
  {
    name: "Sales",
    value: "sales",
    guardrails: {
      owns: [
        "Pipeline generation and conversion, revenue attainment, deal strategy",
        "Sales motion, CRM usage, sales enablement feedback",
      ],
      avoid: [
        "Product feature commitments or roadmap direction",
        "Legal review of contracts (Legal), hiring decisions (People)",
      ],
    },
  },
]

// Helper function to get department by value
export function getDepartmentByValue(value: string): Department | undefined {
  return departments.find((dept) => dept.value === value)
}

// Helper function to get department by name
export function getDepartmentByName(name: string): Department | undefined {
  return departments.find((dept) => dept.name === name)
}
