"use client"

import { useState } from "react"
import FileUpload from "./file-upload"
import { FileWithPreview } from "@/types/file";
import { toast } from "sonner";

export default function FileUploadContainer() {
    const [files, setFiles] = useState<FileWithPreview[]>([]);

    const handleChange = (newFiles: FileWithPreview[]) => {
        setFiles(newFiles);
    }

    const handleRemove = (file: FileWithPreview) => {
        toast.success(`Removed file: ${file.file.name}`);
    }

    return (
        <div className="w-full">
            <FileUpload
                value={files}
                onChange={handleChange}
                onRemove={handleRemove}
                maxFiles={1}
                maxSize={20}
                accept={{
                    "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"],
                    "application/pdf": [".pdf"],
                }}
            />
        </div>
    )
}