# System Patterns: Virtual Try-On Lab

## 1. System Architecture

The application is a monolithic web server built with the **Flask** framework. It follows a traditional client-server model:

-   **Backend (Flask)**: Handles all business logic, including image uploads, file management, and communication with the Google Cloud VTO API. It serves both the web pages (HTML templates) and the API endpoints.
-   **Frontend (Vanilla JS/HTML/CSS)**: The user interface is composed of HTML templates rendered by Flask, with dynamic functionality powered by client-side JavaScript. The frontend communicates with the backend via asynchronous API calls (AJAX/Fetch).
-   **External Service (Google Cloud VTO)**: The core AI functionality is delegated to the Google Cloud Virtual Try-On API. The Flask backend acts as a client to this service.

## 2. Key Technical Decisions

-   **Session Management**: A unique `session_id` (UUID) is generated upon user image upload and stored in the Flask session. This ID is used to associate the user's uploaded image with their try-on requests and results, effectively namespacing their files.
-   **File Handling**:
    -   User uploads, clothing items, and generated results are stored in separate, dedicated folders (`uploads/`, `clothes/`, `results/`).
    -   Uploaded images are standardized by converting them to RGB format and resizing them to a maximum dimension of 1024px to ensure compatibility with the VTO API.
-   **Asynchronous Processing**:
    -   The "Try All Clothes" feature is handled asynchronously to avoid blocking the main application thread and timing out the user's request.
    -   A `BatchProcessor` class manages this background processing, likely using a separate thread or process pool to run the VTO tasks concurrently.
-   **API Design**: The application exposes a RESTful-like API for frontend-backend communication. Key endpoints include:
    -   `/upload`: For submitting the user's image.
    -   `/try-on`: For single, synchronous try-on requests.
    -   `/try-all`: To initiate an asynchronous batch job.
    -   `/try-all-status/<session_id>`: For the frontend to poll for the status of a batch job.
    -   `/try-all-results/<session_id>`: To retrieve the final results of a batch job.
-   **Configuration Management**: Environment-specific configurations, such as the `PROJECT_ID`, are managed through a `.env` file at the project root. This file is loaded at application startup, and its values are accessed as environment variables. This practice keeps sensitive or environment-dependent settings out of version control.

## 3. Core Component Relationships

-   `app.py`: The central orchestrator. It defines the API endpoints, handles HTTP requests and responses, and integrates the other components.
-   `utils/vto_client.py`: A dedicated client module responsible for all direct communication with the Google Cloud VTO API. It abstracts the complexities of the API calls, making the main application code cleaner.
-   `utils/batch_processor.py`: Manages the queue and execution of asynchronous "Try All" jobs. It tracks the progress and stores the results for each session.
-   `templates/`: Contains the HTML structure for the user interface.
    -   `index.html`: The main application page.
    -   `results.html`: The page dedicated to displaying batch processing results.
-   `static/`: Holds the client-side assets.
    -   `js/main.js`: Handles UI interactions on the main page, including image uploads and single try-on requests.
    -   `js/results.js`: Manages the polling for batch status and the display of results on the results page.

## 4. Critical Implementation Paths

-   **Single Try-On Flow**:
    1.  User uploads image (`/upload`).
    2.  Frontend sends `session_id` and selected `clothing_item` to `/try-on`.
    3.  Backend calls `vto_client.try_on()`.
    4.  Result is saved to the `results/` folder.
    5.  Frontend receives the path to the result image and displays it.
-   **Batch Try-On Flow**:
    1.  User uploads image (`/upload`).
    2.  Frontend sends `session_id` to `/try-all`.
    3.  Backend initiates `batch_processor.start_batch()`.
    4.  The `batch_processor` begins processing items in the background.
    5.  Frontend periodically polls `/try-all-status/<session_id>` to update the progress bar.
    6.  Once complete, the user is redirected to `/try-all-results/<session_id>` to view the gallery of outcomes.
