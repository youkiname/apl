
format PE CONSOLE 4.0
entry BeginCode
include 'win32a.inc'

section '.code' executable readable writeable
BeginCode:
mov ecx, 9
; ---ASSIGN---
mov [a], ecx
lp:
mov ecx, [a]
mov ebx, 10
cmp ecx, ebx
je endlp
mov ebx, [a]
mov ecx, 1
; ---ADD---
add ebx, ecx
; ---REASSIGN---
mov [a], ebx
cinvoke printf, formatint, [a]
jmp lp
endlp:

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
