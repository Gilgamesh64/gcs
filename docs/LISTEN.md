# LISTEN

**Usage:**  
LISTEN MSG [time]

**Description:**  
Waits for a **message** before continuing script execution.  
Optionally, a **maximum waiting time** can be specified.

**Parameters:**
- `MSG` – message to listen for (e.g., `HIT_EVENT`, `ATTACK`)  
- `[time]` – optional maximum wait in seconds (**number**)  

**Notes:**

- Only **one message** may be listened for at a time.  
- If `[time]` is missing, the command waits a default amount before skipping the instruction.  
- If `[time]` is provided, it **must be a number**; otherwise, a red squiggle will appear.  
- Autocomplete suggests `0` for the optional `[time]` parameter. Modify it!

**Example:**
LISTEN ATTACK 5

- Waits for the `ATTACK` message up to 5 seconds.