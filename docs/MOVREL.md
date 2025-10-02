# MOVREL

**Usage:**  
MOVREL x,y

**Description:**  
Moves the actor **relative to its current position** on the stage.

**Parameters:**
- `x` – horizontal offset (number)  
- `y` – vertical offset (number)  

**Notes:**
- Both `x` and `y` **must be numbers**, otherwise a red squiggle will appear.  
- Positive values move the actor **right/up**, negative values move **left/down**.  
- The script will proceed only when the coordinates are reached.

**Example:**
MOVREL 10,-5

- Moves the actor 10 units right and 5 units down relative to its current position.
