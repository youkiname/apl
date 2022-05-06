
format PE CONSOLE 4.0
entry BeginCode
include 'win32a.inc'

section '.code' executable readable writeable
BeginCode:
mov ecx, 1
; ---ASSIGN---
mov [a], ecx
macro say_hello 
{
mov ecx, 5
; ---ASSIGN---
mov [say_hello__a], ecx
mov ecx, [say_hello__a]
mov ebx, 1
; ---ADD---
add ecx, ebx
; ---REASSIGN---
mov [say_hello__a], ecx
cinvoke printf, formatint, [say_hello__a]
}
macro fuck 
{
cinvoke printf, formatstr, fuck__ts__1
}
say_hello 
cinvoke printf, formatint, [a]
fuck 

invoke ExitProcess

section '.data' data readable writeable
formatint db "%i", 13, 10, 0
formatfloat db "%f", 13, 10, 0
formatstr db "%s", 13, 10, 0
a dd ?
say_hello__a dd ?
fuck__ts__1 db 'fuck', 0

section '.idata' import data readable writable
library kernel,'KERNEL32.DLL', msvcrt,'msvcrt.dll'
import kernel, ExitProcess,'ExitProcess'
import msvcrt,printf,'printf', getch, '_getch'
