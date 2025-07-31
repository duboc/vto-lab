# Tech Context: Virtual Try-On Lab

## 1. Core Technologies

-   **Backend Framework**: Python 3 with **Flask** (v2.3.3). Used to build the web server, handle API requests, and render HTML templates.
-   **Frontend Technologies**:
    -   **HTML5**: For structuring the web pages.
    -   **CSS3**: For styling the user interface.
    -   **JavaScript (ES6+)**: For client-side interactivity, API communication (Fetch API), and dynamic UI updates. No frontend frameworks are used, relying on vanilla JavaScript.
-   **AI Service**: **Google Cloud AI Platform** with the **Virtual Try-On (VTO) API**. This is the core engine for generating the try-on images.

## 2. Python Dependencies

The backend relies on the following key Python packages, as defined in `requirements.txt`:

-   `Flask==2.3.3`: The web framework.
-   `Pillow==10.0.1`: A powerful image processing library used for handling user uploads (resizing, format conversion).
-   `google-cloud-aiplatform==1.35.0`: The official Google Cloud client library for interacting with AI Platform services, including the VTO model.
-   `google-cloud-storage==2.10.0`: Used by the AI Platform client for handling data, likely for intermediate storage during the VTO process.
-   `Werkzeug==2.3.7`: A dependency of Flask, providing core WSGI functionalities.
-   `python-dotenv==1.0.0`: Used to load environment variables from a `.env` file.

## 3. Development & Deployment Environment

-   **Runtime Environment**: Python 3.8 or higher.
-   **Authentication**: The application uses **Google Cloud Application Default Credentials (ADC)**. This means it can be authenticated via:
    1.  Running `gcloud auth application-default login` in the development environment.
    2.  Setting the `GOOGLE_APPLICATION_CREDENTIALS` environment variable to point to a service account key file, which is common for production deployments.
-   **Development Server**: The application can be run in development mode (`FLASK_ENV=development`), which enables features like automatic reloading on code changes.
-   **Configuration**: Application configuration is managed via a `.env` file in the project root. This file is loaded at startup using the `python-dotenv` library. Key variables like `PROJECT_ID` are stored there to keep them separate from the source code.

## 4. Technical Constraints & Considerations

-   **File Formats**: The application is designed to work with standard image formats like JPG, JPEG, and PNG for both user and clothing images.
-   **Image Sizing**: User-uploaded images are automatically resized to a maximum dimension of 1024px to meet the likely input requirements of the VTO API and to standardize processing.
-   **API Quotas**: The application's functionality is subject to the usage quotas and limits of the Google Cloud Virtual Try-On API.
-   **Statelessness**: While Flask sessions are used to link a user's actions via a `session_id`, the application is largely stateless. All necessary data (images) is stored on the filesystem, and there is no persistent database.
