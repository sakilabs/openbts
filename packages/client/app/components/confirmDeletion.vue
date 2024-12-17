<template>
  <UModal :title="`Czy na pewno chcesz usunąć listę '${name}'?`" :ui="{ footer: 'justify-end' }">
    <template #footer>
      <UButton color="error" label="Usuń listę" size="lg" @click="accept()" icon="heroicons:trash-20-solid" />
      <UButton color="neutral" label="Anuluj usuwanie" size="lg" icon="heroicons:x-mark-16-solid" @click="modal.close()" />
    </template>
  </UModal>
</template>

<script setup lang="ts">
const modal = useModal();

const props = defineProps<{
	name: string;
	list_uuid: string;
}>();

function accept() {
	const event = new CustomEvent("confirmDeletion", { detail: props.list_uuid });
	document.body.dispatchEvent(event);
	modal.close();
}
</script>