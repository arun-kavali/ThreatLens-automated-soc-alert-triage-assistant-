🚨 ThreatLens
AI-Powered SOC Alert Triage & Incident Intelligence Platform

🔗 Live Demo:
👉 https://threat-lens-automated-soc-alert-triage-assistant.vercel.app/

🔍 What is ThreatLens?

ThreatLens is an AI-powered Security Operations Center (SOC) application that automatically analyzes security alerts, correlates real threats into incidents, and provides clear, actionable investigation intelligence to SOC analysts.

It simulates a real-world SOC workflow using AI and backend automation to reduce alert fatigue and speed up incident response.

❗ Problem Statement

SOC analysts today face:

Thousands of alerts every day

High false-positive rates

Manual alert triage

Delayed incident response

Complex and noisy SIEM/SOAR tools

⚠️ Result: Real threats are often missed or detected too late.

💡 Solution Overview

ThreatLens solves this by:

Automatically ingesting security alerts

Using AI to explain what happened, why it’s risky, and what to do next

Correlating related alerts into incidents automatically

Guiding analysts with AI-generated incident intelligence

Clearly separating Alert Sources from SOC Analysts

🔄 Application Workflow

Alert Source injects security alerts (demo simulation)

Alerts are stored in the backend database

AI analyzes each alert and assigns risk & severity

Backend automatically correlates related alerts

An incident is created without manual action

SOC Analyst opens the incident

On Start Investigation, AI provides:

Attack pattern

Business impact

Priority level

Containment steps

Analyst recommendations

Analyst takes action and resolves the incident

Dashboard metrics update in real time

👥 User Roles & Access
🔹 Alert Source

Can generate / inject security alerts

Used only for alert creation (simulated sources)

Cannot view alerts, incidents, or dashboards

🔹 SOC Analyst

Views alerts and incidents

Investigates incidents using AI intelligence

Takes containment actions

Resolves incidents

🚫 No Admin Role
🚫 No manual correlation button

✨ Key Features

Automated alert ingestion (demo-based)

AI-powered alert analysis

Risk scoring (0–100)

Automatic alert correlation into incidents

AI Incident Intelligence:

Attack pattern

Business impact

Priority level

Containment steps

Analyst recommendations

Real-time SOC dashboard

Incident lifecycle tracking:

Open → In Progress → Resolved

Role-based authentication

Rule-based fallback if AI is unavailable

🛠️ Technology Stack
Frontend

React

Tailwind CSS

Vite

Backend

Supabase (Database, Auth, Realtime, Edge Functions)

AI

OpenAI API

Automation

Backend correlation logic

Cron-based scheduled processing

Deployment

Vercel

🧪 Demo Highlights

Generate realistic alerts (phishing, brute force, malware)

Watch AI analyze alerts automatically

See incidents auto-created (no button)

Start investigation to view AI incident intelligence

Resolve incidents and observe live metric updates

📊 Results & Outcome

Reduced alert noise

Faster incident identification

Improved SOC analyst efficiency

Explainable AI-driven decisions

Realistic SOC workflow demonstration

🚀 Future Enhancements

Integration with real SIEM and EDR platforms

Automated SOAR-style response execution

Threat intelligence feed enrichment

Advanced analytics and compliance reporting

Enterprise-scale deployment support
