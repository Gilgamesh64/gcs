# SND

**Usage:**  
SND MSG

**Description:**  
Sends a **message** to the Stage MessageDispatcher.

**Parameter:**
- `MSG` – message to send (e.g., `HIT_EVENT`, `ATTACK`, `END_SCENE`)  

**Notes:**
- Only **one message** can be sent per command.  
- Autocomplete will suggest example messages, they may not exist.  
- Sending an unknown message may have no effect at runtime or throw an Exception.

**Examples:**
SND ATTACK

- Sends the `ATTACK` message to trigger appropriate reactions.