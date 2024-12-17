<template>
	<nav class="flex lg:items-center sticky top-0 z-[999]">
		<div class="fixed top-0 z-[999] mt-3 px-4 w-full lg:max-w-[550px]">
			<div class="flex flex-row gap-2 px-2 py-2 rounded-md">
				<UButton
					class="border-none py-2 text-sm leading-5 text-gray-900 focus:outline-none dark:text-white bg-white dark:bg-[#0f172a]"
					color="neutral"
					variant="outline"
					icon="heroicons:home-16-solid"
					to="/"
					v-if="$route.path.includes('/lists')"
				></UButton>
				<AutoComplete />
				<ListDropdown icon="heroicons:bars-3"></ListDropdown>
			</div>
		</div>
	</nav>
</template>
