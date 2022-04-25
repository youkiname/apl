
format PE CONSOLE 4.0
entry BeginCode
include 'win32a.inc'

section '.code' executable readable writeable
BeginCode:
mov [t1], 3
mov [t2], 10
; ---ADD---
mov eax, [t1]
add eax, [t2]
mov [t1], eax
mov [t2], 2
; ---MULTIPLY---
mov eax, [t1]
imul eax, [t2]
mov [t1], eax
; ---ASSIGN---
mov eax, [t1]
mov [a], eax
mov eax, [a]
mov [t1], eax
mov [t2], 3
; ---ADD---
mov eax, [t1]
add eax, [t2]
mov [t1], eax
; ---ASSIGN---
mov eax, [t1]
mov [b], eax
cinvoke printf, formatint, [a]
cinvoke printf, formatint, [b]

invoke ExitProcess

section '.data' data readable writeable
formatint db "%i", 13, 10, 0
formatfloat db "%f", 13, 10, 0
formatstr db "%s", 13, 10, 0
t1 dd ?
t2 dd ?
a dd ?
b dd ?

section '.idata' import data readable writable
library kernel,'KERNEL32.DLL', msvcrt,'msvcrt.dll'
import kernel, ExitProcess,'ExitProcess'
import msvcrt,printf,'printf', getch, '_getch'
