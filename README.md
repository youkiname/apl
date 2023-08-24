Курсовая работа 6-й семестр

# apl
Handmade Programming Language


## How to run

### Install dependencies
```
npm install
```

### Change code.apl
For example: 
```
fun euclidean(a: int, b: int) {
    while (a != 0 and b != 0) {
        if (a > b) {
            a = a % b
        } else {
            b = b % a
        }
    }
    return a + b
}

int a = 82
int b = 41

print('Euclidean')
int result = euclidean(a, b)
print(result)
```

### Run compiler and show console output

```
npm run run
```
