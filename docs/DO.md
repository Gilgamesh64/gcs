# DO

**Usage:** 
DO SCRIPT

**Description:**  
Executes another script immediately.

**Parameter:**

- `SCRIPT` – the script resource enum (e.g., `INTRO`, `CUTSCENE1`, `BOSS_BATTLE`)  

**Notes:**
- Only **one script** can be executed per command.  
- Autocomplete will suggest example scripts, they may not exist.  
- Make sure the script exists; otherwise, runtime errors may occur.

**Examples:**
DO CUTSCENE1

- Executes the `CUTSCENE1` script immediately.
