
format PE CONSOLE 4.0
entry BeginCode
include 'win32a.inc'

section '.code' executable readable writeable
BeginCode:
mov ecx, 1
; ---ASSIGN---
mov [a], ecx
; ---WHILE---
whilelb1:
mov ecx, 0
cmp ecx, 0
je endwhilelb1
;--- BREAK ---
jmp endwhilelb1
jmp whilelb1
endwhilelb1:

invoke ExitProcess

section '.data' data readable writeable
formatint db "%i", 13, 10, 0
formatfloat db "%f", 13, 10, 0
formatstr db "%s", 13, 10, 0
a dd ?

section '.idata' import data readable writable
library kernel,'KERNEL32.DLL', msvcrt,'msvcrt.dll'
import kernel, ExitProcess,'ExitProcess'
import msvcrt,printf,'printf', getch, '_getch'
