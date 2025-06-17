# 🏠 Property Listing Backend

A backend service for a **Property Listing Platform** with the following key features:

- 🔍 AI-powered search filtering using OpenRouter's Mistral model
- 🖼️ Image watermarking with Sharp
- 🗂️ File upload via Multer
- 🧠 Express + TypeScript backend with MongoDB

---

## 🚀 Features

- **AI Search Parsing**: Convert natural language property queries into structured filters using an AI model.
- **Image Watermarking**: Automatically add company name watermarks to uploaded images.
- **REST API**: Built with Express.js and MongoDB for scalable and maintainable architecture.
- **File Upload Handling**: Supports image uploads with validation using `multer`.
- **TypeScript First**: Full typing and modern tooling for better development experience.

---

## 📦 Installation

### Prerequisites

- Node.js >= 16
- MongoDB (local or Atlas)
- [OpenRouter](https://openrouter.ai/) API Key

### Setup

```bash
git clone https://github.com/your-username/property-finder-be.git
cd property-listing-backend
npm install
