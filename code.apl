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

fun factor(n: int) {
    int d = 2
    while (d*d <= n) {
        if (n % d == 0) {
            print(d)
            n = n div d
        } else {
            d = d + 1
        }
    }
    if (n > 1) {
        print(n)
    }
}

fun fibonacci(n: int) {
    int prev = 1
    int current = 1
    int temp = 0
    while (n > 0) {
        temp = prev + current
        prev = current
        current = temp
        n = n - 1
    }
    return current
}

fun sin(x: int) {
    int a =  4 * x * (180 - x)
    int b = 40500 - x * (180 - x)
    return a / b 
}


int a = 82
int b = 41

print('Euclidean')
int result = euclidean(a, b)
print(result)

print('Factorization')
result = factor(a)
print(result)

print('Fibonacci')
result = fibonacci(b)
print(result)

print('Sin')
int c = 90
float result2 = sin(c)
print(result2)
