# 🚨 ThreatLens – AI-Powered SOC Alert Triage & Incident Intelligence Platform

## 🔗 Live Demo

**ThreatLens:** https://threatlens-automated-soc.vercel.app/

---

## 📌 Overview

ThreatLens is an AI-powered Security Operations Center (SOC) platform designed to automate alert triage, incident correlation, and security investigation workflows.

The platform simulates real-world SOC operations by ingesting security alerts, analyzing them with AI, automatically correlating related events into incidents, and providing actionable investigation intelligence to security analysts.

Its primary goal is to reduce alert fatigue, accelerate incident response, and improve analyst productivity through intelligent automation.

---

## ❗ Problem Statement

Modern Security Operations Centers face several challenges:

* Thousands of alerts generated daily
* High false-positive rates
* Time-consuming manual alert triage
* Delayed incident response
* Complex SIEM and SOAR workflows
* Difficulty identifying real threats among noisy alerts

As a result, critical security incidents can be missed or detected too late.

---

## 💡 Solution

ThreatLens addresses these challenges through:

* Automated alert ingestion
* AI-driven alert analysis
* Risk scoring and severity classification
* Automatic incident correlation
* AI-generated investigation intelligence
* Real-time SOC dashboard monitoring
* Incident lifecycle management

The platform enables analysts to focus on real threats instead of manually processing large volumes of alerts.

---

## 🔄 System Workflow

### 1. Alert Generation

Security alerts are generated through simulated alert sources.

### 2. Alert Ingestion

Alerts are stored in the backend database.

### 3. AI Analysis

Each alert is analyzed using AI to determine:

* Threat context
* Risk score
* Severity level
* Investigation priority

### 4. Alert Correlation

Related alerts are automatically grouped together.

### 5. Incident Creation

ThreatLens creates incidents automatically without manual intervention.

### 6. Investigation

SOC Analysts can start investigations and receive AI-generated intelligence including:

* Attack patterns
* Business impact assessment
* Priority level
* Containment recommendations
* Analyst actions

### 7. Resolution

Incidents progress through:

Open → In Progress → Resolved

### 8. Dashboard Updates

Security metrics update in real time.

---

## 👥 User Roles

### Alert Source

Responsibilities:

* Generate security alerts
* Inject alerts into the platform

Restrictions:

* Cannot access alerts
* Cannot access incidents
* Cannot access dashboard analytics

---

### SOC Analyst

Responsibilities:

* View alerts
* Monitor incidents
* Investigate incidents
* Resolve incidents
* Access dashboard metrics

---

## ✨ Key Features

### AI-Powered Alert Analysis

* Threat explanation
* Risk scoring
* Severity classification
* Context-aware analysis

### Automated Incident Correlation

* Detects related alerts
* Groups alerts into incidents
* Eliminates manual correlation

### AI Incident Intelligence

Provides:

* Attack pattern analysis
* Business impact assessment
* Priority recommendations
* Containment strategies
* Investigation guidance

### Real-Time Dashboard

Track:

* Total alerts
* Active incidents
* Resolved incidents
* Severity distribution
* Investigation status

### Incident Lifecycle Management

Supports:

* Open
* In Progress
* Resolved

### Authentication & Authorization

* Secure authentication
* Role-based access control
* Protected routes

### Fallback Processing

When AI services are unavailable:

* Rule-based risk scoring
* Rule-based severity assignment
* Automated incident summaries

---

## 🏗️ Technology Stack

### Frontend

* React
* TypeScript
* Vite
* Tailwind CSS

### Backend

* Supabase Database
* Supabase Authentication
* Supabase Realtime
* Supabase Edge Functions

### Artificial Intelligence

* OpenAI API

### Automation

* Incident Correlation Engine
* Scheduled Processing Jobs
* Backend Automation Workflows

### Deployment

* Vercel

---

## 📊 Platform Capabilities

### Security Alert Types

ThreatLens can simulate and process:

* Phishing Alerts
* Malware Detection
* Brute Force Attempts
* Suspicious Logins
* Credential Abuse
* Unauthorized Access Attempts

### Incident Intelligence

For every incident, ThreatLens can generate:

* Threat Summary
* Attack Chain Analysis
* Business Risk Assessment
* Recommended Actions
* Containment Procedures

---

## 🚀 Getting Started

### Clone Repository

```bash
git clone <repository-url>
cd threatlens
```

### Install Dependencies

```bash
npm install
```

### Configure Environment Variables

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
OPENAI_API_KEY=
```

### Run Development Server

```bash
npm run dev
```

### Build Production Version

```bash
npm run build
```

### Deploy

```bash
vercel --prod
```

---

## 📈 Expected Outcomes

ThreatLens helps organizations:

* Reduce alert fatigue
* Accelerate incident response
* Improve analyst efficiency
* Increase threat visibility
* Standardize investigation workflows
* Demonstrate modern AI-driven SOC operations

---

## 🔮 Future Enhancements

Planned improvements include:

* SIEM Integration
* EDR Integration
* SOAR Automation
* Threat Intelligence Feed Enrichment
* Compliance Reporting
* Advanced Security Analytics
* Multi-Tenant Enterprise Support
* Automated Response Playbooks

---

## 👨‍💻 Author

**Arun Kavali**

AI-Powered Cybersecurity & Security Operations Project

---

## ⭐ Project Vision

ThreatLens demonstrates how Artificial Intelligence can enhance Security Operations Centers by automating repetitive tasks, reducing alert fatigue, and enabling analysts to focus on high-priority threats.

The project showcases the future of intelligent security operations through explainable AI and automated incident response workflows.
