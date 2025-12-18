# ANI

**Usage:** 
ANI animation

**Description:**  
Changes the **current animation** of the actor.

**Parameters:**
- `animation` – the animation resource enum (e.g., `IDLE`, `WALK`, `ATTACK`)  

**Notes:**
- Only **one parameter** is allowed.  
- Autocomplete will suggest example animations, they may not exist.  
- Using an unknown animation name will not trigger red squiggles, but may cause runtime errors if the resource does not exist.

**Example:**
ANI IDLE

-Changes the actor’s animation to `IDLE`.