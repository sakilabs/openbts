import { useState, useRef, useCallback, type SubmitEvent } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { HugeiconsIcon } from "@hugeicons/react";
import { ImageAdd01Icon, Cancel01Icon, SentIcon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { API_BASE } from "@/lib/api";

type ImagePreview = {
	id: string;
	file: File;
	previewUrl: string;
};

type AddCommentFormProps = {
	stationId: number;
};

async function postComment(stationId: number, content: string, files: File[]) {
	const formData = new FormData();
	formData.append("content", content);
	for (const file of files) {
		formData.append("files", file);
	}

	const response = await fetch(`${API_BASE}/stations/${stationId}/comments`, {
		method: "POST",
		body: formData,
		credentials: "include",
	});

	if (!response.ok) {
		const error = await response.json().catch(() => ({}));
		throw new Error(error.message || "Failed to post comment");
	}

	return response.json();
}

export function AddCommentForm({ stationId }: AddCommentFormProps) {
	const { t } = useTranslation("stationDetails");
	const [content, setContent] = useState("");
	const [images, setImages] = useState<ImagePreview[]>([]);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const queryClient = useQueryClient();

	const mutation = useMutation({
		mutationFn: () =>
			postComment(
				stationId,
				content,
				images.map((img) => img.file),
			),
		onSuccess: () => {
			setContent("");
			setImages([]);
			queryClient.invalidateQueries({ queryKey: ["station-comments", stationId] });
		},
	});

	const handleAddImages = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
		const files = Array.from(e.target.files || []);
		const validFiles = files.filter((file) => file.type.startsWith("image/"));

		const newImages: ImagePreview[] = validFiles.map((file) => ({
			id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
			file,
			previewUrl: URL.createObjectURL(file),
		}));

		setImages((prev) => [...prev, ...newImages]);

		if (fileInputRef.current) fileInputRef.current.value = "";
	}, []);

	const handleRemoveImage = useCallback((id: string) => {
		setImages((prev) => {
			const updated = prev.filter((img) => img.id !== id);
			const removed = prev.find((img) => img.id === id);
			if (removed) URL.revokeObjectURL(removed.previewUrl);
			return updated;
		});
	}, []);

	const handleSubmit = (e: SubmitEvent) => {
		e.preventDefault();
		if (!content.trim() && images.length === 0) return;
		mutation.mutate();
	};

	const isDisabled = mutation.isPending || (!content.trim() && images.length === 0);

	return (
		<form onSubmit={handleSubmit} className="space-y-2">
			<div className="space-y-2">
				<Textarea
					placeholder={t("comments.placeholder")}
					value={content}
					onChange={(e) => setContent(e.target.value)}
					disabled={mutation.isPending}
					className="min-h-20 resize-none"
				/>

				{images.length > 0 && (
					<div className="flex flex-wrap gap-2">
						{images.map((image) => (
							<div key={image.id} className="relative group rounded-lg overflow-hidden border bg-muted/20">
								<img src={image.previewUrl} alt="Preview" className="size-20 object-cover" />
								<button
									type="button"
									onClick={() => handleRemoveImage(image.id)}
									className={cn(
										"absolute top-1 right-1 size-5 rounded-full",
										"bg-background/80 backdrop-blur-sm border shadow-sm",
										"flex items-center justify-center",
										"opacity-0 group-hover:opacity-100 transition-opacity",
										"hover:bg-destructive hover:text-destructive-foreground",
									)}
								>
									<HugeiconsIcon icon={Cancel01Icon} className="size-3" />
								</button>
							</div>
						))}
					</div>
				)}
			</div>

			<div className="flex items-center justify-between gap-2">
				<div className="flex items-center gap-2">
					<input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleAddImages} className="hidden" />
					<Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={mutation.isPending}>
						<HugeiconsIcon icon={ImageAdd01Icon} className="size-4" />
						<span>{t("comments.addImages")}</span>
					</Button>
				</div>

				<Button type="submit" size="sm" disabled={isDisabled}>
					<span>{mutation.isPending ? t("comments.posting") : t("comments.postComment")}</span>
					{mutation.isPending ? <Spinner data-icon="inline-end" /> : <HugeiconsIcon icon={SentIcon} className="size-4" data-icon="inline-end" />}
				</Button>
			</div>

			{mutation.isError && (
				<p className="text-sm text-destructive">{mutation.error instanceof Error ? mutation.error.message : t("comments.postError")}</p>
			)}
		</form>
	);
}
