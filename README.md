<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/60ba64f6-8e50-47f3-bb43-a7f590e5aa57

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Preprocessed HAM10000 dataset

The project includes the preprocessed `HAM10000_Final_Project` dataset directory with:

- `HAM10000_processed_metadata.csv`
- `HAM10000_X.npy` and encoded train/validation/test labels
- The three exported `.keras` model files

The server checks this directory at `/api/dataset/status` and the Diagnostic Workbench displays an explicit dataset error if files are missing. To use a different location, set `HAM10000_DATASET_DIR` before starting the server.

The current browser UI uses its existing TypeScript demo inference engine; Node/TypeScript does not execute the included Keras models directly. The dataset is therefore validated and used for metadata/class-distribution reporting, while model execution requires a Python/TensorFlow serving layer.
