# Website concision audit

Reviewed September 30, 2026. Scope: the local GCI Print Lab homepage, lab, requests, queue, projects, resources, instructor, training overview, and student day pages. This is a content and structure audit, not a rendered usability test. The live domain could not be accessed through the web tool; deployment parity is unverified. The changes described in the implementation record below were subsequently applied locally.

## Main finding

The site can become substantially easier to scan by giving each page one primary job and removing repeated summaries. The greatest opportunity is the homepage, followed by the lab and instructor pages. Keep practical instructions, safety rules, form labels, and instructional scaffolding where users need them.

## Prioritized changes

| Priority | Location and evidence | Recommended change | Benefit |
|---|---|---|---|
| High | `index.html`: About the Lab, six Quick Access cards, five training-day cards, Learning Outcomes, Printer Inventory, Announcements, final training CTA | Keep a short introduction, three prominent actions (Request a Print, Check Queue, Start Training), and a compact set of secondary links. Move the detailed day schedule and outcomes to Training; keep equipment details on the lab page. Remove the final repeated training pitch. | Visitors reach their task with less reading and scrolling. |
| High | `print-farm.html`: Submission Expectations and Print Rules & Expectations both cover preparation, supports, review, and approval | Merge into one submission section. Group it under File Preparation, Review, Pickup, and Reprints. Link to that section from requests and resources. | One authoritative set of rules is easier to read and maintain. |
| High | `instructor.html`: Roles & Responsibilities, Daily Workflow, Printer Monitoring Expectations repeat review, monitoring, cleanup, and handoff | Retain a compact roles list, the operational review checklist, and one start/during/end-of-class checklist. Remove the second cleanup list. | Operators get an actionable reference with less duplication. |
| Medium | `requests.html`: file-link helper, sharing instructions, upload explanation, access check, and privacy explanation | Keep one short helper beside each File Link field. Put detailed Drive sharing instructions in an expandable help section. Preserve the sign-in requirement and return-to-form instruction when uploads are used. | Less explanation between the user and submission. |
| Medium | `queue.html`: hero privacy sentence, privacy callout, status cards, and full-width submission CTA | Keep one privacy sentence, the queue, refresh information, and a compact status key. Keep one request link instead of a second large request pitch. | Job status becomes the focus. |
| Medium | `training/index.html`: six outcomes cards plus five day descriptions and four bullets per day | Use one short outcomes paragraph; give each day a title, one sentence, and student/slides links. | Makes the course sequence quicker to scan. |
| Medium | `resources.html`: extensive getting-started instructions, tool cards, maintenance cards, troubleshooting table, glossary card, FAQ | Preserve section jump links and the troubleshooting table. Shorten tool cards to audience/use case plus link. Collapse longer setup and maintenance guidance using accessible details/summary controls. Reduce the glossary section to a direct link. | Readers can find help without reading the whole library. |
| Medium | `projects.html`: category tags, metadata, description, and badges often repeat printer/material/category | Use a title, one metadata line, and one sentence describing what makes the project useful or interesting. Keep filters and relevant project links. | Gallery cards become easier to compare. |
| Lower | Training day pages: goal, overview bullets, time guide, workflow, success criteria, vocabulary, and individual steps repeat concepts | Keep the goal, current step, task instructions, required checks, and reflection. Consider collapsing time guides and vocabulary. On Day 4, consolidate repeated advice about simple logos into one checklist. On Day 5, reduce repeated waiting/queue advice. | Reduces initial page density while retaining learning support. |
| Lower | Sitewide: eyebrow labels, heading, tags, and footer badges repeat the same idea | Remove decorative labels that add no meaning. Standardize on “Request a Print,” “Print Queue,” “Training,” and “Lab.” Consider one Training footer link instead of every day on general pages, while keeping day navigation inside training. | Fewer labels compete for attention. |

## Resolve inconsistencies during cleanup

These require selecting the intended rule or curriculum, rather than simply deleting text.

- **Training titles:** The homepage, training overview, instructor links, and many footers call Day 4 “Troubleshoot and Reflect” and Day 5 “Capstone — Remix and Improve.” The student pages are “Design Your School Logo Keychain” and “Print Day — Run the Lab.” Align the summaries and links with the intended student sequence; check slides separately before renaming them.
- **Naming:** Lab and instructor pages require `Lastname_Firstname_Project_v1`; Days 4–5 require `LastName_Keychain.3mf`. Choose a consistent convention or state the training exception once.
- **Upload size:** The lab page says under 100 MB; the upload server enforces 25 MB (`apps-script/upload/Code.gs`). State “Uploads: up to 25 MB.” Clarify separately whether link-based files have another limit.
- **Accepted submissions:** The request form supports model links and idea images, while lab rules describe only STL/3MF models. Separate “Print-ready models” from “Ideas and design help” in the consolidated rules.
- **Review inputs:** The instructor checklist refers to a submitted time estimate and requested printer, but the current student form does not collect these. Replace those checks with operator tasks, such as estimating time and choosing a printer.
- **Queue meaning:** The public status key describes Waiting as awaiting review; the instructor reference describes it as approved. Use the same meaning in both locations.
- **Announcements:** “Spring Training Sessions,” “New,” and “Current” have no supporting dates. Confirm whether the announcement is active; otherwise remove it or replace it with an evergreen training link.
- **Institution name:** Homepage copy says Genesee Career Institute while lab/footer copy says Genesee Community College. Confirm the official name and standardize it.

## Suggested replacement copy

| Location | Suggested wording |
|---|---|
| Homepage introduction | “GCI’s student-operated 3D print lab. Learn to design and print, request a project, or check your job status.” |
| Training homepage card | “Learn the workflow in five hands-on sessions.” |
| Request introduction | “Request a print or share a design idea. A lab operator will review it and follow up.” |
| File Link helper | “Paste a Drive or MakerWorld link the lab can open, or upload a file with a Google account.” |
| Upload helper | “After uploading, select ‘Return to request form’ to add your file link.” |
| Queue privacy sentence | “The public queue shows job details without names, emails, or file links.” |
| Queue refresh helper | “Updates every 60 seconds.” |
| Waiting status, if the instructor definition remains authoritative | “Approved and waiting for a printer.” |
| Complete status | “Printing finished; awaiting inspection.” |
| Ready for Pickup status | “Inspected and ready to collect during lab hours.” |
| Gallery introduction | “Explore student and staff prints.” |
| Gallery keychain description | “School logo keychain designed in Tinkercad.” |
| Resources introduction | “Tools and guides for design, slicing, maintenance, and troubleshooting.” |

## Recommended homepage structure

1. Lab name and one-sentence purpose.
2. Request a Print, Check Queue, and Start Training.
3. Secondary links: About the Lab, Projects, Resources, Instructor.
4. A dated announcement only when there is timely news.
5. Compact footer.

## Implementation order and checks

First reconcile training titles, naming, submission requirements, and queue definitions. Then simplify the homepage, merge the lab rules, and consolidate instructor operations. Finish with form helpers and smaller card/label edits.

After implementation, check that the three main tasks remain easy to find on desktop and mobile; that existing rules-section anchors still resolve; that student/staff forms, upload return flow, cost calculator, and queue filtering still work; and that training progress, response generation, required checks, and accessible navigation remain intact. Word-count reductions can document the change, but task clarity is the acceptance criterion. No reduction percentage is claimed without measuring the revised content.

## Implementation record

Applied locally September 30, 2026:

- Rebuilt the homepage around Request a Print, Check Queue, and Start Training, followed by four secondary links. Removed repeated equipment/training summaries and undated announcements.
- Merged submission expectations into the existing lab rules section, retaining the rules anchor and adding an alias for the former expectations heading. Preserved practical print limits, approval requirements, pickup rules, and reprint guidance.
- Documented the 25 MB upload limit and the existing training keychain naming exception. Added image/design-help guidance and corrected reprint instructions to use Notes rather than a nonexistent project-type option.
- Consolidated instructor monitoring and cleanup, removed editor placeholders, and changed review instructions to match current form fields.
- Shortened queue descriptions, form help, gallery descriptions, and the training overview. Moved detailed sharing/setup and maintenance guidance into native expandable sections.
- Aligned Day 4/5 navigation and overview summaries with student lessons and verified the corresponding slide topics. Corrected the gallery keychain tutorial link to Day 4.
- Removed conflicting institutional attributions from changed pages without choosing an unverified official institution name.
- Preserved lesson instructions, progress controls, form fields, scripts, queue behavior, and pricing logic. Fixed an existing unmatched Day 5 closing tag and a request-page accessibility reference.

Static checks passed for all 15 changed HTML pages: balanced element nesting, unique IDs, accessibility ID references, local file links and linked anchors, and unchanged form/input/select/textarea/script tags on request and student pages. `git diff --check` passed. Runtime submission, upload, queue, and visual desktop/mobile checks were not performed.

Main-content word counts (excluding navigation/footer, HTML tags, comments, and scripts): homepage 629 → 58; training overview 552 → 308; queue 274 → 148; gallery 393 → 283; instructor 943 → 865; lab 1,232 → 1,159; requests 634 → 601. Expandable resource guidance retains its text while reducing initial visible content.

Changes have not been published to the live website.
