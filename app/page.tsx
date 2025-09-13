import FileUploadContainer from "@/components/file-upload-container";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="w-full max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">
          Drag and Drop File Upload
        </h1>
        <FileUploadContainer />
      </div>
    </main>
  );
}
