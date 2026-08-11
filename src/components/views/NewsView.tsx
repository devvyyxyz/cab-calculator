"use client";

import { AccountSwitchModal } from "@/components/app/AccountSwitchModal";
import { useAppState } from "@/components/app/AppStateProvider";

export function NewsView() {
  const state = useAppState();

  return (
    <div className="relative flex h-full w-full flex-col">
      <div className="shrink-0 px-4 pt-4 sm:px-6">
        <div className="mx-auto max-w-7xl flex flex-col items-center gap-2">
          <h2
            className="text-outline text-center text-2xl text-white sm:text-3xl"
            style={{ fontFamily: "var(--font-pixel), monospace" }}
          >
            NEWS & ANNOUNCEMENTS
          </h2>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 sm:px-6">
        <div className="mx-auto max-w-7xl">
        <div
          className="mb-6 rounded-xl border border-white/10 bg-white/95 p-6 shadow-lg"
          style={{
            backgroundImage: "url('/stud_texture.png')",
            backgroundSize: "30px 30px",
            backgroundRepeat: "repeat",
            backgroundBlendMode: "multiply",
          }}
        >
          <div className="mb-4 flex items-center gap-3">
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg"
              style={{
                background: "linear-gradient(135deg, #fbbf24, #f59e0b)",
                border: "3px solid #1e3a5f",
                boxShadow: "0 3px 0 0 #1e3a5f",
              }}
            >
              <span className="text-2xl">📢</span>
            </div>
            <div className="flex flex-col">
              <span
                className="text-base font-bold text-gray-900"
                style={{ fontFamily: "var(--font-pixel), monospace" }}
              >
                OFFICIAL ANNOUNCEMENT
              </span>
              <span className="text-xs text-gray-600">
                Posted in #announcements
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <h3
              className="text-xl font-bold text-gray-900"
              style={{ fontFamily: "var(--font-pixel), monospace" }}
            >
              Trading calculator, values list, inventory viewer & more
            </h3>

            <p className="text-sm text-gray-700">
              Hey everyone, I have developed a server official{" "}
              <a
                href="https://cab.devvyy.xyz/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-blue-600 underline hover:text-blue-700"
              >
                catch a brainrot rotdex site
              </a>
              . You can find the site here:{" "}
              <a
                href="https://cab.devvyy.xyz/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-blue-600 underline hover:text-blue-700"
              >
                https://cab.devvyy.xyz/
              </a>
            </p>

            <div>
              <h4
                className="mb-2 text-base font-bold text-gray-900"
                style={{ fontFamily: "var(--font-pixel), monospace" }}
              >
                Features
              </h4>
              <ul className="ml-6 list-disc space-y-1 text-sm text-gray-700">
                <li>Trade calculator</li>
                <li>Inventory viewer</li>
                <li>
                  Rot, item, and egg database overview viewer of all in-game
                  (including unreleased)
                </li>
                <li>Values list</li>
                <li className="italic text-gray-500">much more to be added soon</li>
              </ul>
            </div>

            <div>
              <h4
                className="mb-2 text-base font-bold text-gray-900"
                style={{ fontFamily: "var(--font-pixel), monospace" }}
              >
                To be added
              </h4>
              <ul className="ml-6 list-disc space-y-1 text-sm text-gray-700">
                <li>Roblox login</li>
                <li>Trade sharing (for W/L sharing)</li>
                <li>
                  Updated values to be more accurate with in-game trades and
                  demand
                </li>
                <li>Demand indicators</li>
                <li>Recent trades page</li>
                <li>Brainrot IV comparison</li>
                <li>Team building</li>
                <li>
                  Player info page (for viewing other players stats and
                  inventories)
                </li>
                <li>Notifications</li>
                <li>Damage calculator</li>
                <li>Tier list creator/sharing</li>
              </ul>
            </div>

            <div className="border-t-2 border-gray-300 pt-3">
              <p className="text-xs text-gray-600 italic">
                The site has just been released, trading values and stats will
                be updated the more use it gets and when in-game trading database
                connection is possible.
              </p>
            </div>
          </div>
        </div>
        </div>
      </div>

      <AccountSwitchModal
        open={state.showAccountModal}
        onClose={() => state.setShowAccountModal(false)}
        onConfirm={state.handleSwitchAccount}
        profile={state.youProfile}
      />
    </div>
  );
}
