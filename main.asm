
format PE CONSOLE 4.0
entry BeginCode
include 'win32a.inc'

section '.code' executable readable writeable
BeginCode:
mov ecx, 3
; ---ASSIGN---
mov [a], ecx
; ---WHILE---
lb1:
mov ecx, [a]
mov ebx, 10
cmp ecx, ebx
mov eax, 0
lahf
and ah, 1
mov ebx, eax
cmp ebx, 0
je endlb1
cinvoke printf, formatint, [a]
mov ecx, [a]
mov edx, 1
; ---ADD---
add ecx, edx
; ---REASSIGN---
mov [a], ecx
jmp lb1
endlb1:

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
