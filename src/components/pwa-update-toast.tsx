import { RefreshCw, X } from "lucide-react";
import * as React from "react";
import type { RegisterSWOptions } from "vite-plugin-pwa/types";

import { Button } from "#/components/ui/button";

type ToastState = "offline-ready" | "update-ready";

export function PwaUpdateToast() {
	const [toastState, setToastState] = React.useState<ToastState>();
	const [refreshing, setRefreshing] = React.useState(false);
	const updateServiceWorkerRef =
		React.useRef<(reloadPage?: boolean) => Promise<void>>();

	React.useEffect(() => {
		if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
			return;
		}

		let active = true;
		let offlineReadyTimer: number | undefined;

		const registerServiceWorker = async () => {
			const { registerSW } = await import("virtual:pwa-register");

			if (!active) {
				return;
			}

			const options: RegisterSWOptions = {
				immediate: true,
				onNeedRefresh() {
					if (active) {
						setToastState("update-ready");
					}
				},
				onOfflineReady() {
					if (!active) {
						return;
					}

					setToastState("offline-ready");
					offlineReadyTimer = window.setTimeout(() => {
						if (active) {
							setToastState(undefined);
						}
					}, 4500);
				},
				onRegisterError() {
					if (active) {
						setToastState(undefined);
					}
				},
			};

			updateServiceWorkerRef.current = registerSW(options);
		};

		void registerServiceWorker().catch(() => {
			if (active) {
				setToastState(undefined);
			}
		});

		return () => {
			active = false;
			if (offlineReadyTimer !== undefined) {
				window.clearTimeout(offlineReadyTimer);
			}
		};
	}, []);

	if (!toastState) {
		return null;
	}

	const isUpdateReady = toastState === "update-ready";

	return (
		<output className="pwa-toast" aria-live="polite">
			<div className="pwa-toast__copy">
				<strong>
					{isUpdateReady ? "New version available" : "Ready offline"}
				</strong>
				<span>
					{isUpdateReady
						? "Refresh to update Fretful."
						: "Fretful can now open without a connection."}
				</span>
			</div>
			<div className="pwa-toast__actions">
				{isUpdateReady ? (
					<Button
						type="button"
						size="sm"
						disabled={refreshing}
						onClick={() => {
							setRefreshing(true);
							void updateServiceWorkerRef.current?.(true);
						}}
					>
						<RefreshCw />
						Refresh
					</Button>
				) : null}
				<Button
					type="button"
					size="icon-sm"
					variant="ghost"
					aria-label="Dismiss"
					onClick={() => setToastState(undefined)}
				>
					<X />
				</Button>
			</div>
		</output>
	);
}
