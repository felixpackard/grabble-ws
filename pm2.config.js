module.exports = {
	apps: [
		{
			name: "server",
			script: "packages/server/src/index.ts",
			interpreter: "bun",
			env: {
				PATH: `${process.env.HOME}/.bun/bin:${process.env.PATH}`,
			},
		},
	],
};
