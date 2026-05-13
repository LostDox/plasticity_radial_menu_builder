import requests
import json
import re

ICON_OVERRIDES = {
    "polysplines": "polyspline",
    # Add more icon overrides here if new tools have mismatched icon names in the future
}

COMMAND_OVERRIDES = {
    "polysplines": "poly-splines",
    # Add more command overrides here if the official docs have incorrect command strings for new tools
}

print("🔄 Fetching latest Plasticity commands from official docs...")

# Best source page with many command examples
url = "https://doc.plasticity.xyz/plasticity-essentials/radial-menu"
response = requests.get(url)
text = response.text

# Find all command:xxx patterns
matches = re.findall(r'command:([a-z0-9\-]+)', text)

# Remove duplicates and sort
unique_commands = sorted(set(matches))

command_list = []
for i, cmd in enumerate(unique_commands, 1):
    # Make a nice readable label
    label = cmd.replace('-', ' ').title()
    
    icon_name = ICON_OVERRIDES.get(cmd, cmd)
    actual_cmd = COMMAND_OVERRIDES.get(cmd, cmd)
    
    command_list.append({
        "id": i,
        "label": label,
        "icon": icon_name,
        "command": f"command:{actual_cmd}",
        "label_zh": label,
        "isAdd": False
    })

# We changed this to save directly into the src folder!
output_path = "src/plasticity-commands.json"
output = {"commandList": command_list}

with open(output_path, "w", encoding="utf-8") as f:
    json.dump(output, f, indent=2, ensure_ascii=False)

print(f"✅ Success! Found and saved {len(command_list)} commands")
print(f"File saved to: {output_path}")
print("Note: Icon and command overrides applied for any mismatched tools (e.g. polysplines → polyspline / poly-splines)")