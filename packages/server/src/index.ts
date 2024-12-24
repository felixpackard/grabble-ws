import serveStatic from "serve-static-bun";
import { MessageHandler } from "./lib/message-handler";
import { type WebSocketData } from "shared/types/websocket";

const messageHandler = new MessageHandler();

const server = Bun.serve<WebSocketData>({
	fetch(req, server) {
		const path = new URL(req.url).pathname;
		if (path === "/ws") {
			const upgraded = server.upgrade(req);
			if (!upgraded) {
				return new Response("Upgrade failed", { status: 400 });
			}
		}

		// handle HTTP request normally
		return serveStatic("packages/client/dist")(req);
	},
	websocket: {
		publishToSelf: false,
		async message(ws, message) {
			if (typeof message !== "string") {
				ws.send("Invalid message");
				return;
			}

			messageHandler.onMessage(server, ws, message);
		},
		open(ws) {
			messageHandler.onOpen(ws);
		},
		close(ws, code, message) {
			messageHandler.onClose(server, ws);
		},
	},
});

console.log(`Listening on ${server.hostname}:${server.port}`);
