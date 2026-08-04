<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# AGENT.md

## Project

Parking Management System

ประกอบด้วยระบบ Admin สำหรับจัดการข้อมูลรถเข้า-ออก คิดค่าจอด ติดตามสถานะการชำระเงิน และแสดงผลผ่าน Dashboard รวมถึงระบบ Customer สำหรับสแกน QR Code เพื่อชำระค่าจอด และรับสิทธิ์ใช้งาน Free Wi-Fi ผ่านรหัส Wi-Fi Voucher ที่กำหนดระยะเวลาการใช้งาน

## Workspace Context

This project is part of the EECD Car Park system.

Frontend:
D:\Work\Code Ntnova\eecd-car-park

Backend Authentication Service:
D:\Work\Code Ntnova\eecd-production\service-system\microservice\authentication-service

When the user says "frontend", use the eecd-car-park project.
When the user says "backend", use the authentication-service project.
When the user says "ทั้งสองฝั่ง", "full flow", "login flow", "auth flow", or "เชื่อม API", inspect and update both projects as needed.

Default ports:
- Frontend Next.js: http://localhost:3001
- Backend Auth API: http://localhost:3000
- Backend API prefix: /api

Auth integration:
- Frontend uses NextAuth credentials provider.
- Backend login endpoint is POST /api/auth/login.
- Frontend env should use NEXT_PUBLIC_API

---

## Stack

- Next.js (App Router)
- TypeScript
- React
- Tailwind CSS
- shadcn/ui
- TanStack Query
- TanStack Table
- React Hook Form + Zod
- Auth.js

---

## Read First

- README.md

## Read On Demand

- UI → .agents/skills/frontend-design/SKILL.md
- React → .agents/skills/vercel-react-best-practices/SKILL.md

---

## Development Rules

- Read only required files.
- Never read documentation unless required.
- Prefer minimal diffs.
- Reuse existing code before creating new code.
- Follow existing code style.
- Keep changes scoped to the task.
- Preserve existing architecture and API contracts.
- Never rewrite large files unless necessary.
- Avoid deprecated APIs.
- Prefer composition over duplication.

---

## UX/UI Rules (Without Designer)

- Prioritize usability, accessibility, and consistency.
- Keep interfaces simple, intuitive, and responsive.
- Reuse existing components and design patterns.
- Provide clear loading, empty, error, and success states.
- Follow modern UI/UX best practices.

---

## Project Structure

### Folder Rules

Keep routing, shared components, business logic, services, utilities, types, constants, configuration, and state organized according to the project's architecture.

### Placement Rules

- Prefer feature-first organization.
- Keep code close to where it is used.
- Promote to shared only after reuse.
- Avoid duplicate code.
- Keep imports predictable.

---

## Workflow

Before every implementation:

1. Understand the current behavior.
2. Identify the problem.
3. Evaluate the risk.
4. Propose the solution.
5. List affected files.

Deliver:

- Reusable components
- Typed code
- Accessible UI
- Responsive UI
- Production-ready code
- Maintainable code
