<template>
	<div>
		<div>
			<div
				v-for="(comment, index) in modifiableComments"
				:key="`${comment.bts_id}-${comment.comment_id ?? 0}`"
				:class="modifiableComments.length >= 2 && 'mt-2'"
			>
				<UCard>
					<template #header>
						<div class="flex flex-row w-full items-center justify-between">
							<p class="font-medium flex items-center">
								<UIcon :name="comment.author.id === 0 ? 'heroicons:information-circle-20-solid' : 'heroicons:user-16-solid'" />
								<span class="ml-1">{{ capitalize(comment.author.name) }}</span>
							</p>
							<a
								href="#"
								@click="removeComment(comment.comment_id ?? 0)"
								class="items-center flex"
								title="Usuń komentarz"
								v-if="comment.author.id !== 0 && comment.author.id === loggedUser?.user_id"
							>
								<UIcon name="heroicons:trash-20-solid" />
							</a>
						</div>
					</template>
					<div class="min-w-fit" :class="comment?.attachments?.length && 'mb-5'">
						<p v-if="comment?.content" v-dompurify-html="parseMarked(comment.content)" class="break_words"></p>
						<UCarousel v-if="comment?.attachments?.length" v-slot="{ item }" dots :items="comment?.attachments" class="max-w-xs">
							<img :src="`/images/${item}`" lazy class="rounded-lg" />
						</UCarousel>
					</div>

					<template #footer v-if="comment.author.id !== 0">
						<div class="w-full">
							<p class="text-sm">Dodane w {{ $dayjs(comment.datePosted).format("LLLL") }}</p>
						</div>
					</template>
				</UCard>
			</div>
		</div>
		<USeparator class="mt-3 mb-3" size="lg" />
		<div class="max-w-sm mx-auto">
			<label for="message" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Dodaj nową notatkę</label>
			<div class="relative">
				<a href="#" @click.prevent="triggerFileInput" class="absolute bottom-3 left-2 text-xs flex items-center z-[999]">
					<UIcon name="heroicons:document-plus-20-solid" />
					<span class="ml-1">Dodaj zdjęcie</span>
				</a>
				<UTextarea
					v-model="text"
					placeholder="Notka o bazie, zdjęcia lub jakieś ważne info..."
					class="w-full block resize-none"
					autoresize
					:rows="5"
					min-rows="5"
					@dragover.prevent
					@drop.prevent="onFileChange"
				/>
			</div>
			<div v-if="images.length" class="mt-1 flex flex-wrap gap-2">
				<div v-for="(image, index) in images" :key="index" class="flex items-center space-x-2">
					<span
						class="inline-flex items-center px-2 py-1 me-2 text-sm font-medium text-blue-800 bg-blue-100 rounded dark:bg-blue-900 dark:text-blue-300 space-x-2 max-w-sm"
					>
						<img :src="image.url" alt="Selected Image" class="w-10 h-10 object-cover rounded-md" />
						<span class="text-sm truncate">{{ image.name }}</span>
						<button
							@click="removeImage(image.name)"
							type="button"
							class="inline-flex items-center p-1 ms-2 text-sm text-blue-400 bg-transparent rounded-sm hover:bg-blue-200 hover:text-blue-900 dark:hover:bg-blue-800 dark:hover:text-blue-300"
							aria-label="Remove"
						>
							<UIcon name="heroicons:x-mark-20-solid" />
						</button>
					</span>
				</div>
			</div>
			<input type="file" ref="fileInput" @change="onFileChange" accept="image/*" multiple style="display: none" />
			<button
				type="button"
				class="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800 mt-2"
				@click.prevent="submitForm"
			>
				Wyślij
			</button>
		</div>
	</div>
</template>
<style lang="css">
.break_words > * > a {
	color: rgb(59 130 246);
}

.break_words > * > a:hover {
	text-decoration: underline;
}
</style>
<script setup lang="ts">
import { parseMarked } from "@/utils/helpers.js";
import { execFetch } from "@/composables/useCustomFetch.js";

import type { BTSStationNotes } from "@/interfaces/bts.js";

interface Attachment {
	uuid: string;
	type: string;
}

const props = defineProps<{
	bts_id: number;
	comments: BTSStationNotes[];
}>();

const modifiableComments = ref<BTSStationNotes[]>(props.comments);
const text = ref("");
const images = ref<{ url: string; name: string; blob: Blob }[]>([]);
const fileInput = ref<HTMLInputElement | null>(null);

watch(
	() => props.comments,
	async (newComments) => {
		modifiableComments.value = [];
		await nextTick();
		modifiableComments.value = newComments;
	},
);

async function submitForm() {
	const attachments = await uploadAttachments();
	await sendComment(props.bts_id, attachments.data);
	images.value = [];
	text.value = "";
}

const loggedUser = loggedInUser();

const uploadAttachments = async (): Promise<{ success: boolean; data?: Attachment[]; error?: string }> => {
	if (!images.value.length) return { success: true, data: [] };
	const formData = new FormData();
	let index = 0;
	for (const image of images.value) {
		index++;
		formData.append(`file_${index}`, image.blob);
	}

	const data = await execFetch<Attachment[] | null>("/uploadAttachments", {
		body: formData,
		method: "PUT",
	});
	if (!data) return { success: false, error: "Wystąpił błąd podczas przesyłania załączników" };

	return { success: true, data };
};

const sendComment = async (bts_id: number, attachments: Attachment[] = []): Promise<{ success: boolean; data?: BTSStationNotes; error?: string }> => {
	const data = await execFetch<BTSStationNotes | null>(`/bts/${bts_id}/notes`, {
		body: JSON.stringify({
			comment_note: text.value.trim() === "" ? null : text.value.trim(),
			attachments: attachments,
		}),
		method: "PUT",
	});
	if (!data) return { success: false, error: "Wystąpił błąd podczas wysyłania komentarza" };

	if (props.comments) modifiableComments.value.push(data);
	return { success: true, data };
};

const removeComment = async (comment_id: number): Promise<{ success: boolean; data?: { message: string }; error?: string } | null> => {
	if (comment_id === 0) return null;
	const data = await execFetch<{ message: string } | null>(`/bts/${props.bts_id}/notes`, {
		body: JSON.stringify({
			comment_id,
		}),
		method: "DELETE",
	});
	if (!data) return { success: false, error: "Wystąpił błąd podczas usuwania komentarza" };

	modifiableComments.value = modifiableComments.value.filter((comment) => comment.comment_id !== comment_id);
	return { success: true, data };
};

const isDuplicateImage = (name: string) => {
	return images.value.some((image) => image.name === name);
};

const onFileChange = (event: Event) => {
	const target = event.target as HTMLInputElement;
	const files = target.files ?? (event as DragEvent).dataTransfer?.files;
	if (!files) return;
	for (let i = 0; i < files.length; i++) {
		const file = files[i];
		if (file?.type.startsWith("image/")) {
			if (isDuplicateImage(file.name)) continue;
			const reader = new FileReader();
			reader.onload = (e) => {
				if (!e.target) return;
				const imageUrl = e.target.result;
				images.value.push({ url: imageUrl as string, blob: file, name: file.name });
			};
			reader.readAsDataURL(file);
		}
	}

	target.value = "";
};

const triggerFileInput = () => {
	fileInput?.value?.click();
};

const removeImage = (name: string) => {
	images.value = images.value.filter((image) => image.name !== name);
};
</script>
