
format PE CONSOLE 4.0
entry BeginCode
include 'win32a.inc'

section '.code' executable readable writeable
BeginCode:
a = 10
say_hello:
cinvoke printf, formatstr, msg
end say_hello

invoke ExitProcess

section '.data' data readable writeable
formatint db "%i", 13, 10, 0
formatstr db "%s", 13, 10, 0
msg db 'hello ', 0

section '.idata' import data readable writable
library kernel,'KERNEL32.DLL', msvcrt,'msvcrt.dll'
import kernel, ExitProcess,'ExitProcess'
import msvcrt,printf,'printf', getch, '_getch'
