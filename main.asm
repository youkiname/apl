
format PE CONSOLE 4.0
entry BeginCode
include 'win32a.inc'

section '.code' executable readable writeable
BeginCode:
macro say_hello
{
pop ecx
mov [say_hello__a], ecx
pop ecx
mov [say_hello__b], ecx
cinvoke printf, formatint, [say_hello__a]
cinvoke printf, formatstr, say_hello__ts__1
cinvoke printf, formatint, [say_hello__b]
}
mov ecx, 1
; ---ASSIGN---
mov [a], ecx
mov ecx, 10
; ---ASSIGN---
mov [b], ecx
push [b]
push [a]
say_hello

invoke ExitProcess

section '.data' data readable writeable
formatint db "%i", 13, 10, 0
formatfloat db "%f", 13, 10, 0
formatstr db "%s", 13, 10, 0
say_hello__a dd ?
say_hello__b dd ?
say_hello__ts__1 db 'hi', 0
a dd ?
b dd ?

section '.idata' import data readable writable
library kernel,'KERNEL32.DLL', msvcrt,'msvcrt.dll'
import kernel, ExitProcess,'ExitProcess'
import msvcrt,printf,'printf', getch, '_getch'
