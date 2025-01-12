import serveStatic from "serve-static-bun";
import { MessageHandler } from "./lib/message-handler";
import { type WebSocketData } from "shared/types/websocket";
import { ServerMessageType } from "shared/types/message";

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
		return serveStatic("packages/client/build")(req);
	},
	websocket: {
		idleTimeout: 60 * 10, // 10 minutes
		publishToSelf: false,
		async message(ws, message) {
			if (typeof message !== "string") {
				ws.send(
					JSON.stringify({
						type: ServerMessageType.Error,
						data: { message: "Invalid message" },
					}),
				);
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
