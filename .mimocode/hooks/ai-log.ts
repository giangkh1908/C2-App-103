import { spawn } from "child_process"
import { join } from "path"

const SCRIPTS_DIR = join(process.cwd(), "scripts")
const LOG_SCRIPT = join(SCRIPTS_DIR, "log_hook.py")

function callLogger(data: Record<string, unknown>) {
  try {
    const isWin = process.platform === "win32"
    const child = isWin
      ? spawn(
          "powershell.exe",
          [
            "-NoProfile",
            "-NonInteractive",
            "-ExecutionPolicy",
            "Bypass",
            "-File",
            join(SCRIPTS_DIR, "_pyrun.ps1"),
            LOG_SCRIPT,
            "--tool=mimocode",
          ],
          { stdio: ["pipe", "ignore", "ignore"] },
        )
      : spawn(
          "bash",
          [join(SCRIPTS_DIR, "_pyrun.sh"), LOG_SCRIPT, "--tool=mimocode"],
          { stdio: ["pipe", "ignore", "ignore"] },
        )
    child.stdin.write(JSON.stringify(data))
    child.stdin.end()
  } catch {
    // Hook must never block the agent
  }
}

export default {
  "chat.message": async (input: any, output: any) => {
    const msg = output?.message
    if (!msg) return

    const role = msg.role
    if (role !== "user") return

    let content = ""
    if (output?.parts) {
      content = output.parts
        .filter((p: any) => p.type === "text" && !p.synthetic)
        .map((p: any) => p.text)
        .join("")
    } else if (typeof msg.content === "string") {
      content = msg.content
    } else if (Array.isArray(msg.content)) {
      content = msg.content
        .filter((p: any) => p.type === "text")
        .map((p: any) => p.text)
        .join("")
    }

    if (!content) return

    const modelID =
      input?.model?.modelID || input?.model?.providerID || ""

    callLogger({
      hook_event_name: "UserPromptSubmit",
      prompt: content.slice(0, 1000),
      model: modelID,
      session_id: input.sessionID || "",
    })
  },

  "tool.execute.after": async (input: any, output: any) => {
    callLogger({
      hook_event_name: "PostToolUse",
      tool_name: input.tool || "",
      tool_input: (() => {
        try {
          const s = JSON.stringify(input.args)
          return s.length > 500 ? s.slice(0, 500) + "…" : s
        } catch {
          return String(input.args).slice(0, 500)
        }
      })(),
      tool_response: String(output?.output ?? "").slice(0, 500),
      session_id: input.sessionID || "",
    })
  },
}
