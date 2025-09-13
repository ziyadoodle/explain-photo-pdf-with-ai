import { FileWithPreview } from "@/types/file"
import { Textarea } from "./ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { cn } from "@/lib/utils";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { FileIcon, Loader2, Trash2, Upload } from "lucide-react";
import Image from "next/image";
import { Button } from "./ui/button";
import { getAiResult } from "@/actions/getAiResult";
import Markdown from 'react-markdown'

interface FileUploadProps {
    value?: FileWithPreview[];
    onChange?: (files: FileWithPreview[]) => void;
    onRemove?: (file: FileWithPreview) => void;
    maxFiles?: number;
    maxSize?: number; // in MB
    accept?: { [key: string]: string[] };
    disabled?: boolean;
    className?: string;
}

export default function FileUpload({
    value = [],
    onChange,
    onRemove,
    maxFiles = 1,
    maxSize = 20,
    accept = {
        "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"],
        "application/pdf": [".pdf"],
    },
    disabled = false,
}: FileUploadProps) {
    const [files, setFiles] = useState<FileWithPreview[]>(value);

    const [isLoading, setIsLoading] = useState<boolean>(false);

    const [prompt, setPrompt] = useState<string>("");

    const [aiResult, setAiResult] = useState<string>("");

    const createFilePreview = (file: File): Promise<string | null> => {
        return new Promise((resolve) => {
            if (file.type.startsWith("image/")) {
                const reader = new FileReader();
                reader.onload = () => {
                    resolve(reader.result as string);
                };
                reader.readAsDataURL(file);
            } else {
                resolve(null);
            }
        })
    }

    const simulateUpload = (fileWithPreview: FileWithPreview) => {
        let progress = 0;
        const interval = setInterval(() => {
            progress += 5;

            setFiles((prevFiles) =>
                prevFiles.map((f) =>
                    f.file === fileWithPreview.file
                        ? { ...f, progress: Math.min(progress, 100) }
                        : f
                )
            );

            if (progress >= 100) {
                clearInterval(interval);
                setFiles(
                    (prevFiles) => prevFiles.map(
                        (f) => f.file === fileWithPreview.file
                            ? { ...f, success: true }
                            : f
                    )
                );
            }
        }, 100);
    }

    const onDrop = useCallback(
        async (acceptedFiles: File[]) => {
            const newFiles: FileWithPreview[] = [];

            for (const file of acceptedFiles) {
                if (files.length + newFiles.length >= maxFiles) {
                    break;
                }

                const preview = await createFilePreview(file);

                const fileWithPreview: FileWithPreview = {
                    file,
                    preview,
                    progress: 0,
                };

                newFiles.push(fileWithPreview);
                simulateUpload(fileWithPreview);
            }

            const updatedFiles = [...files, ...newFiles];
            setFiles(updatedFiles);
            onChange?.(updatedFiles);
        }, [files, maxFiles, onChange]
    );

    const {
        getRootProps,
        getInputProps,
        isDragActive,
    } = useDropzone({
        onDrop,
        accept,
        maxSize: maxSize * 1024 * 1024,
        multiple: true,
        disabled: disabled || files.length >= maxFiles,
    });

    const handleRemove = useCallback((fileToRemove: FileWithPreview) => {
        const updatedFiles = files.filter((f) => f.file !== fileToRemove.file);
        setFiles(updatedFiles);
        onChange?.(updatedFiles);
        onRemove?.(fileToRemove);
    }, [files, onChange, onRemove]);

    const onSubmit = async () => {
        setIsLoading(true);

        const result = await getAiResult(prompt, files[0].file);

        setAiResult(result);
        setIsLoading(false);
    }

    const handleClose = () => {
        setPrompt("");
        setAiResult("");
        setFiles([]);
    }

    return (
        <div className="flex flex-col gap-5">
            {aiResult && (
                <div className="flex flex-col gap-3 p-4 border rounded-lg">
                    <Markdown>{aiResult}</Markdown>
                    <Button onClick={handleClose}>Close Explanation</Button>
                </div>
            )}
            <Textarea
                rows={10}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Type your prompt here..."
            />
            <Card>
                <CardHeader>
                    <CardTitle>File Upload</CardTitle>
                    <CardDescription>Drag and drop files or click to upload</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div
                        {...getRootProps()}
                        className={cn("relative flex flex-col items-center justify-center w-full h-32 p-4 border-2 border-dashed rounded-lg transition-colors",
                            isDragActive
                                ? "border-primary bg-primary/5"
                                : "border-muted-foreground/25",
                            disabled && "opacity-50 cursor-not-allowed", "hover:bg-muted/50"
                        )}>
                        <input {...getInputProps()} />
                        <div className="flex flex-col items-center justify-center text-center">
                            <Upload className="size-8 mb-2 text-muted-foreground" />
                            <p className="text-sm font-medium">Drag files here or click to upload</p>
                        </div>
                    </div>

                    {files.length > 0 && (
                        <div className="space-y-2">
                            {files.map((file, index) => (
                                <div key={`${file.file.name}-${index}`} className="flex items-center p-2 border rounded-lg">
                                    <div className="flex items-center flex-1 min-w-0 gap-2">
                                        {file.preview
                                            ? (
                                                <div className="relative size-20 overflow-hidden rounded">
                                                    <Image
                                                        src={file.preview}
                                                        alt={file.file.name}
                                                        width={0}
                                                        height={0}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                            )
                                            : (
                                                <div>
                                                    <FileIcon className="size-5 text-muted-foreground" />
                                                </div>
                                            )}
                                    </div>
                                    <Button
                                        variant={"ghost"}
                                        size={"icon"}
                                        className="ml-2 size-8"
                                        onClick={() => handleRemove(file)}
                                        disabled={disabled}
                                    >
                                        <Trash2 className="size-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
                <CardFooter>
                    <div className="flex w-full justify-between">
                        <p className="text-xs text-muted-foreground">
                            {`${files.filter((f) => !f.error).length}/${maxFiles} files uploaded`}
                        </p>
                        <div>
                            <Button disabled={isLoading} onClick={onSubmit}>
                                {isLoading
                                    ? <Loader2 className="size-4 animate-spin" />
                                    : "Submit"
                                }
                            </Button>
                        </div>
                    </div>
                </CardFooter>
            </Card>
        </div>
    )
}