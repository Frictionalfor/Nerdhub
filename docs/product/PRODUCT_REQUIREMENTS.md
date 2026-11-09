# Product Requirements

## Vision

**NerdHub — A place where curiosity has no boundaries.**

NerdHub is a cross-disciplinary ecosystem where people can ask, explore, publish, build, collaborate and demonstrate what they learn.

## Product principles

1. Curiosity over credentials.
2. Knowledge over popularity.
3. Merit over money.
4. Attribution and licensing are first-class.
5. Safety and privacy by design.
6. Extensible topics and content.
7. Portable identity and data.
8. Progressive complexity.
9. Accessibility as a requirement.
10. Open core with transparent operating boundaries.

## Primary audiences

- Curious beginners looking for welcoming explanations.
- Builders looking for collaborators and visibility.
- Specialists looking for thoughtful discussion and publication.
- Educators and mentors sharing resources.
- Organizers running communities and activities.
- Moderators maintaining healthy spaces.

## Core product areas

| Area                       | Purpose                                     | Initial priority |
| -------------------------- | ------------------------------------------- | ---------------- |
| Identity and profiles      | Account, identity, interests, customization | P0               |
| Topics and discovery       | Taxonomy, following, search and feeds       | P0               |
| Community content          | Discussions, questions, ideas, comments     | P0               |
| Publishing                 | Long-form articles/blogs                    | P0               |
| Idea Lab                   | Track ideas, updates and collaborators      | P0               |
| Reputation and progression | XP, achievements, leaderboards              | P0/P1            |
| Cosmetics                  | Frames, banners, themes and decorations     | P1               |
| Notifications              | Useful in-app updates                       | P1               |
| Projects and clubs         | Collaboration and specialist groups         | P1               |
| Challenges                 | Structured learning/creation activities     | P1               |
| Opportunities and events   | Discover collaboration and events           | P2               |
| Academy/resources          | Curated learning and reference material     | P2               |
| Messaging                  | Private conversations                       | P2               |

## Content types

- Discussion: open-ended conversation.
- Question: request for an answer or explanation.
- Idea: early-stage concept intended for feedback or collaboration.
- Article: long-form authored content with revisions and topics.
- Project: structured work with members, updates and releases (later phase).

Every content type needs ownership, timestamps, visibility rules, moderation/reporting hooks and safe rendering.

## Feed principles

- Following and Latest are deterministic baseline modes.
- Recommended ranking must be explainable and must not silently privilege paid users.
- Avoid optimizing for raw time spent or notification opens.
- Provide controls to mute topics and block users.
- Make chronological mode available.

## Gamification principles

- XP reflects validated contribution, not purchased status.
- Reputation and XP are separate concepts.
- NerdCoins, if used, are cosmetic-only and cannot buy ranking or expertise.
- Award rules are server-side, versioned and auditable.
- Duplicate events must be idempotent.
- Corrections use compensating ledger entries.
- Do not reward spam, low-effort repetition or manipulative engagement.

## MVP user journeys

1. Install → launch → register/sign in → onboarding → follow topics.
2. Open feed → read → create discussion/question/idea → receive replies.
3. Open profile → edit bio/interests/links → view activity.
4. Write article → preview → publish → revise.
5. Report content → receive confirmation → moderation review.
6. Earn valid XP → inspect progress → equip an owned cosmetic.
7. Export account data or submit deletion request.

## Non-goals for first release

- Arbitrary code execution or an online programming judge.
- Voice/video rooms.
- Native mobile apps.
- Full LMS.
- Cash marketplace or payouts.
- Microservices/Kubernetes.
- AI-generated content as a core dependency.
- Full federation/decentralization.

## Success metrics

Measure meaningful contribution, quality, safety, accessibility and reliability:

- Onboarding completion and first meaningful contribution.
- Time to first useful answer.
- Questions receiving accepted/useful responses.
- Returning contributors by topic.
- Idea-to-collaboration conversion.
- Moderation response time and repeat abuse.
- Crash-free sessions and accessibility defects.

Do not use time spent or raw post volume as a standalone success metric.
