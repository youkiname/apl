format PE CONSOLE 4.0
entry BeginCode
include 'win32a.inc'

section '.code' executable readable writeable
BeginCode:

mov ecx, 82
; ---ASSIGN---
mov [a], ecx
mov ecx, 41
; ---ASSIGN---
mov [b], ecx
cinvoke printf, formatstr, ts__1
; --- CAll FUNCTION euclidean ---
push [b]
push [a]
pop ecx
mov [euclidean__a], ecx
pop ecx
mov [euclidean__b], ecx
euclidean__fun1:
; ---WHILE---
euclidean__whilelb2:
mov ecx, [euclidean__a]
mov ebx, 0
; --- COMPARING != ---
cmp ecx, ebx
mov eax, 0
lahf
and ah, 64
cmp eax, 0
mov eax, 1
je euclidean__lb3
mov eax, 0
euclidean__lb3:
mov ebx, eax
mov ecx, [euclidean__b]
mov edx, 0
; --- COMPARING != ---
cmp ecx, edx
mov eax, 0
lahf
and ah, 64
cmp eax, 0
mov eax, 1
je euclidean__lb4
mov eax, 0
euclidean__lb4:
mov edx, eax
; --- and ---
cmp ebx, 0
mov ebx, 0
je euclidean__lb5
mov ebx, 1
euclidean__lb5:
cmp edx, 0
mov edx, 0
je euclidean__lb6
mov edx, 1
euclidean__lb6:
and ebx, edx
cmp ebx, 0
je endeuclidean__whilelb2
; --- IFELSE ---
euclidean__lb7:
mov ebx, [euclidean__a]
mov edx, [euclidean__b]
; --- COMPARING > ---
cmp ebx, edx
mov eax, 0
lahf
and ah, 65
cmp eax, 0
jne euclidean__lb8
mov eax, 1
jmp endeuclidean__lb8
euclidean__lb8:
mov eax, 0
endeuclidean__lb8:
mov edx, eax
cmp edx, 0
je elseeuclidean__lb7
mov edx, [euclidean__a]
mov ebx, [euclidean__b]
; ---MULTIPLY---
mov eax, edx
mov edx, 0
div ebx
mov edx, edx
; ---REASSIGN---
mov [euclidean__a], edx
jmp endeuclidean__lb7
elseeuclidean__lb7:
mov edx, [euclidean__b]
mov ebx, [euclidean__a]
; ---MULTIPLY---
mov eax, edx
mov edx, 0
div ebx
mov edx, edx
; ---REASSIGN---
mov [euclidean__b], edx
endeuclidean__lb7:
jmp euclidean__whilelb2
endeuclidean__whilelb2:
mov edx, [euclidean__a]
mov ebx, [euclidean__b]
; ---ADD---
add edx, ebx
mov eax, edx
jmp endeuclidean__fun1
mov eax, 0
endeuclidean__fun1:
; ---ASSIGN---
mov [result], eax
cinvoke printf, formatint, [result]
cinvoke printf, formatstr, ts__2
; --- CAll FUNCTION factor ---
push [a]
pop ecx
mov [factor__n], ecx
factor__fun9:
mov ecx, 2
; ---ASSIGN---
mov [factor__d], ecx
; ---WHILE---
factor__whilelb10:
mov ecx, [factor__d]
mov ebx, [factor__d]
; ---MULTIPLY---
imul ecx, ebx
mov ebx, [factor__n]
; --- COMPARING <= ---
cmp ecx, ebx
mov eax, 0
lahf
and ah, 65
mov ebx, eax
cmp ebx, 0
je endfactor__whilelb10
; --- IFELSE ---
factor__lb11:
mov ebx, [factor__n]
mov ecx, [factor__d]
; ---MULTIPLY---
mov eax, ebx
mov edx, 0
div ecx
mov ebx, edx
mov ecx, 0
; --- COMPARING == ---
cmp ebx, ecx
mov eax, 0
lahf
and ah, 64
mov ecx, eax
cmp ecx, 0
je elsefactor__lb11
cinvoke printf, formatint, [factor__d]
mov ecx, [factor__n]
mov ebx, [factor__d]
; ---MULTIPLY---
mov eax, ecx
mov edx, 0
div ebx
; ---REASSIGN---
mov [factor__n], eax
jmp endfactor__lb11
elsefactor__lb11:
mov ebx, [factor__d]
mov ecx, 1
; ---ADD---
add ebx, ecx
; ---REASSIGN---
mov [factor__d], ebx
endfactor__lb11:
jmp factor__whilelb10
endfactor__whilelb10:
; --- IF ---
factor__lb12:
mov ebx, [factor__n]
mov ecx, 1
; --- COMPARING > ---
cmp ebx, ecx
mov eax, 0
lahf
and ah, 65
cmp eax, 0
jne factor__lb13
mov eax, 1
jmp endfactor__lb13
factor__lb13:
mov eax, 0
endfactor__lb13:
mov ecx, eax
cmp ecx, 0
je endfactor__lb12
cinvoke printf, formatint, [factor__n]
endfactor__lb12:
mov eax, 0
endfactor__fun9:
; ---REASSIGN---
mov [result], eax
cinvoke printf, formatint, [result]
cinvoke printf, formatstr, ts__3
; --- CAll FUNCTION fibonacci ---
push [b]
pop ecx
mov [fibonacci__n], ecx
fibonacci__fun14:
mov ecx, 1
; ---ASSIGN---
mov [fibonacci__prev], ecx
mov ecx, 1
; ---ASSIGN---
mov [fibonacci__current], ecx
mov ecx, 0
; ---ASSIGN---
mov [fibonacci__temp], ecx
; ---WHILE---
fibonacci__whilelb15:
mov ecx, [fibonacci__n]
mov ebx, 0
; --- COMPARING > ---
cmp ecx, ebx
mov eax, 0
lahf
and ah, 65
cmp eax, 0
jne fibonacci__lb16
mov eax, 1
jmp endfibonacci__lb16
fibonacci__lb16:
mov eax, 0
endfibonacci__lb16:
mov ebx, eax
cmp ebx, 0
je endfibonacci__whilelb15
mov ebx, [fibonacci__prev]
mov ecx, [fibonacci__current]
; ---ADD---
add ebx, ecx
; ---REASSIGN---
mov [fibonacci__temp], ebx
mov ebx, [fibonacci__current]
; ---REASSIGN---
mov [fibonacci__prev], ebx
mov ebx, [fibonacci__temp]
; ---REASSIGN---
mov [fibonacci__current], ebx
mov ebx, [fibonacci__n]
mov ecx, 1
; ---ADD---
sub ebx, ecx
; ---REASSIGN---
mov [fibonacci__n], ebx
jmp fibonacci__whilelb15
endfibonacci__whilelb15:
mov ebx, [fibonacci__current]
mov eax, ebx
jmp endfibonacci__fun14
mov eax, 0
endfibonacci__fun14:
; ---REASSIGN---
mov [result], eax
cinvoke printf, formatint, [result]
cinvoke printf, formatstr, ts__4
mov ecx, 90
; ---ASSIGN---
mov [c], ecx
; --- CAll FUNCTION sin ---
push [c]
pop ecx
mov [sin__x], ecx
sin__fun17:
mov ecx, 4
mov ebx, [sin__x]
; ---MULTIPLY---
imul ecx, ebx
mov ebx, 180
mov edx, [sin__x]
; ---ADD---
sub ebx, edx
; ---MULTIPLY---
imul ecx, ebx
; ---ASSIGN---
mov [sin__a], ecx
mov ecx, 40500
mov ebx, [sin__x]
; ---ADD---
sub ecx, ebx
mov ebx, 180
mov edx, [sin__x]
; ---ADD---
sub ebx, edx
; ---MULTIPLY---
imul ecx, ebx
; ---ASSIGN---
mov [sin__b], ecx
mov ecx, [sin__a]
mov ebx, [sin__b]
; ---MULTIPLY---
; CONVERT TO FLOAT
imul ecx, 1000
mov eax, ecx
mov edx, 0
div ebx
mov eax, eax
jmp endsin__fun17
mov eax, 0
endsin__fun17:
; ---ASSIGN---
mov [result2], eax
mov eax, [result2]
mov edx, 0
mov ebx, 1000
div ebx
cinvoke printf, formatfloat, eax, edx


invoke ExitProcess

section '.data' data readable writeable
formatint db "%i", 13, 10, 0
formatfloat db "%i.%03i", 13, 10, 0
formatstr db "%s", 13, 10, 0

a  dd ?

b  dd ?

ts__1  db 'Euclidean', 0

euclidean__a  dd ?

euclidean__b  dd ?

result  dd ?

ts__2  db 'Factorization', 0

factor__n  dd ?

factor__d  dd ?

ts__3  db 'Fibonacci', 0

fibonacci__n  dd ?

fibonacci__prev  dd ?

fibonacci__current  dd ?

fibonacci__temp  dd ?

ts__4  db 'Sin', 0

c  dd ?

sin__x  dd ?

sin__a  dd ?

sin__b  dd ?

result2  dd ?



section '.idata' import data readable writable
library kernel,'KERNEL32.DLL', msvcrt,'msvcrt.dll'
import kernel, ExitProcess,'ExitProcess'
import msvcrt,printf,'printf', getch, '_getch'