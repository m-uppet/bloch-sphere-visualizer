import { defineConfig } from "vite";

export default defineConfig(({ command }) => ({
	base: command === "build" ? "/bloch-sphere-visualizer/" : "/",
	build: {
		rollupOptions: {
			input: {
				main: "./index.html",
				bloch: "./bloch.html",
			},
		},
	},
}));
