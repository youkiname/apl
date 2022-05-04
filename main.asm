
format PE CONSOLE 4.0
entry BeginCode
include 'win32a.inc'

section '.code' executable readable writeable
BeginCode:
mov ecx, 3
; ---ASSIGN---
mov [a], ecx
; --- IF ---
lb1:
mov ecx, [a]
mov ebx, 5
cmp ecx, ebx
mov eax, 0
lahf
and ah, 65
mov ebx, eax
cmp ebx, 0
je endlb1
; --- IFELSE ---
lb2:
mov ebx, [a]
mov ecx, 5
cmp ebx, ecx
mov eax, 0
lahf
and ah, 1
mov ecx, eax
cmp ecx, 0
je elselb2
cinvoke printf, formatstr, ts__1
jmp endlb2
elselb2:
cinvoke printf, formatstr, ts__2
endlb2:
endlb1:

invoke ExitProcess

section '.data' data readable writeable
formatint db "%i", 13, 10, 0
formatfloat db "%f", 13, 10, 0
formatstr db "%s", 13, 10, 0
a dd ?
ts__1 db 'a < 5', 0
ts__2 db 'a == 5', 0

section '.idata' import data readable writable
library kernel,'KERNEL32.DLL', msvcrt,'msvcrt.dll'
import kernel, ExitProcess,'ExitProcess'
import msvcrt,printf,'printf', getch, '_getch'
