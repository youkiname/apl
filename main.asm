
format PE CONSOLE 4.0
entry BeginCode
include 'win32a.inc'

section '.code' executable readable writeable
BeginCode:
a = 10
while a>0
cinvoke printf, formatint, a
a = a-1
if a<3
cinvoke printf, formatstr, msg
end if
end while

invoke ExitProcess

section '.data' data readable writeable
formatint db "%i", 13, 10, 0
formatstr db "%s", 13, 10, 0
msg db 'You are cool', 0

section '.idata' import data readable writable
library kernel,'KERNEL32.DLL', msvcrt,'msvcrt.dll'
import kernel, ExitProcess,'ExitProcess'
import msvcrt,printf,'printf', getch, '_getch'
