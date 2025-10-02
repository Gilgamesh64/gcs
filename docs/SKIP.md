# SKIP

**Usage:**  
SKIP

**Description:**  
Skips **one frame** of execution.

**Parameters:**  
None

**Notes:**
- No parameters are allowed.  
- Useful in some niche situations 
- Attempting to add parameters will trigger a red squiggle.

**Example:**
SKIP

- Skips one frame of execution.

**use:**
Actor 1:
LISTEN MSG1
SND ACK

Actor 2: 
SND MSG1
LISTEN ACK

In this scenario, actor 2 sends the msg. actor 1, being on listen proceeds with their script, sending the ack
By how the LISTEN is designed, the script will proceed immediately, not waiting for the following frame
But actor 2 didn't have the time to run the LISTEN command!!
Actor 1 must wait one frame, giving actor 2 the time to run LISTEN

So the correct script would be:  

Actor 1:
LISTEN MSG1
SKIP
SND ACK

Actor 2: 
SND MSG1
LISTEN ACK