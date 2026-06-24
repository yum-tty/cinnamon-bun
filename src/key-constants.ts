// key-constants.ts | key code constants (bubbletea port)

// KeyExtended is a special key code used to signify that a key event
// contains multiple runes.
export const KeyExtended = 0x10FFFF

// Special keys.
export const KeyUp = KeyExtended + 2
export const KeyDown = KeyExtended + 3
export const KeyRight = KeyExtended + 4
export const KeyLeft = KeyExtended + 5
export const KeyBegin = KeyExtended + 6
export const KeyFind = KeyExtended + 7
export const KeyInsert = KeyExtended + 8
export const KeyDelete = KeyExtended + 9
export const KeySelect = KeyExtended + 10
export const KeyPgUp = KeyExtended + 11
export const KeyPgDown = KeyExtended + 12
export const KeyHome = KeyExtended + 13
export const KeyEnd = KeyExtended + 14

// Keypad keys.
export const KeyKpEnter = KeyExtended + 15
export const KeyKpEqual = KeyExtended + 16
export const KeyKpMultiply = KeyExtended + 17
export const KeyKpPlus = KeyExtended + 18
export const KeyKpComma = KeyExtended + 19
export const KeyKpMinus = KeyExtended + 20
export const KeyKpDecimal = KeyExtended + 21
export const KeyKpDivide = KeyExtended + 22
export const KeyKp0 = KeyExtended + 23
export const KeyKp1 = KeyExtended + 24
export const KeyKp2 = KeyExtended + 25
export const KeyKp3 = KeyExtended + 26
export const KeyKp4 = KeyExtended + 27
export const KeyKp5 = KeyExtended + 28
export const KeyKp6 = KeyExtended + 29
export const KeyKp7 = KeyExtended + 30
export const KeyKp8 = KeyExtended + 31
export const KeyKp9 = KeyExtended + 32

// Kitty keyboard protocol keypad keys.
export const KeyKpSep = KeyExtended + 33
export const KeyKpUp = KeyExtended + 34
export const KeyKpDown = KeyExtended + 35
export const KeyKpLeft = KeyExtended + 36
export const KeyKpRight = KeyExtended + 37
export const KeyKpPgUp = KeyExtended + 38
export const KeyKpPgDown = KeyExtended + 39
export const KeyKpHome = KeyExtended + 40
export const KeyKpEnd = KeyExtended + 41
export const KeyKpInsert = KeyExtended + 42
export const KeyKpDelete = KeyExtended + 43
export const KeyKpBegin = KeyExtended + 44

// Function keys.
export const KeyF1 = KeyExtended + 45
export const KeyF2 = KeyExtended + 46
export const KeyF3 = KeyExtended + 47
export const KeyF4 = KeyExtended + 48
export const KeyF5 = KeyExtended + 49
export const KeyF6 = KeyExtended + 50
export const KeyF7 = KeyExtended + 51
export const KeyF8 = KeyExtended + 52
export const KeyF9 = KeyExtended + 53
export const KeyF10 = KeyExtended + 54
export const KeyF11 = KeyExtended + 55
export const KeyF12 = KeyExtended + 56
export const KeyF13 = KeyExtended + 57
export const KeyF14 = KeyExtended + 58
export const KeyF15 = KeyExtended + 59
export const KeyF16 = KeyExtended + 60
export const KeyF17 = KeyExtended + 61
export const KeyF18 = KeyExtended + 62
export const KeyF19 = KeyExtended + 63
export const KeyF20 = KeyExtended + 64
export const KeyF21 = KeyExtended + 65
export const KeyF22 = KeyExtended + 66
export const KeyF23 = KeyExtended + 67
export const KeyF24 = KeyExtended + 68
export const KeyF25 = KeyExtended + 69
export const KeyF26 = KeyExtended + 70
export const KeyF27 = KeyExtended + 71
export const KeyF28 = KeyExtended + 72
export const KeyF29 = KeyExtended + 73
export const KeyF30 = KeyExtended + 74
export const KeyF31 = KeyExtended + 75
export const KeyF32 = KeyExtended + 76
export const KeyF33 = KeyExtended + 77
export const KeyF34 = KeyExtended + 78
export const KeyF35 = KeyExtended + 79
export const KeyF36 = KeyExtended + 80
export const KeyF37 = KeyExtended + 81
export const KeyF38 = KeyExtended + 82
export const KeyF39 = KeyExtended + 83
export const KeyF40 = KeyExtended + 84
export const KeyF41 = KeyExtended + 85
export const KeyF42 = KeyExtended + 86
export const KeyF43 = KeyExtended + 87
export const KeyF44 = KeyExtended + 88
export const KeyF45 = KeyExtended + 89
export const KeyF46 = KeyExtended + 90
export const KeyF47 = KeyExtended + 91
export const KeyF48 = KeyExtended + 92
export const KeyF49 = KeyExtended + 93
export const KeyF50 = KeyExtended + 94
export const KeyF51 = KeyExtended + 95
export const KeyF52 = KeyExtended + 96
export const KeyF53 = KeyExtended + 97
export const KeyF54 = KeyExtended + 98
export const KeyF55 = KeyExtended + 99
export const KeyF56 = KeyExtended + 100
export const KeyF57 = KeyExtended + 101
export const KeyF58 = KeyExtended + 102
export const KeyF59 = KeyExtended + 103
export const KeyF60 = KeyExtended + 104
export const KeyF61 = KeyExtended + 105
export const KeyF62 = KeyExtended + 106
export const KeyF63 = KeyExtended + 107

// Kitty keyboard protocol keys.
export const KeyCapsLock = KeyExtended + 108
export const KeyScrollLock = KeyExtended + 109
export const KeyNumLock = KeyExtended + 110
export const KeyPrintScreen = KeyExtended + 111
export const KeyPause = KeyExtended + 112
export const KeyMenu = KeyExtended + 113

// Media keys.
export const KeyMediaPlay = KeyExtended + 114
export const KeyMediaPause = KeyExtended + 115
export const KeyMediaPlayPause = KeyExtended + 116
export const KeyMediaReverse = KeyExtended + 117
export const KeyMediaStop = KeyExtended + 118
export const KeyMediaFastForward = KeyExtended + 119
export const KeyMediaRewind = KeyExtended + 120
export const KeyMediaNext = KeyExtended + 121
export const KeyMediaPrev = KeyExtended + 122
export const KeyMediaRecord = KeyExtended + 123

// Volume keys.
export const KeyLowerVol = KeyExtended + 124
export const KeyRaiseVol = KeyExtended + 125
export const KeyMute = KeyExtended + 126

// Modifier keys.
export const KeyLeftShift = KeyExtended + 127
export const KeyLeftAlt = KeyExtended + 128
export const KeyLeftCtrl = KeyExtended + 129
export const KeyLeftSuper = KeyExtended + 130
export const KeyLeftHyper = KeyExtended + 131
export const KeyLeftMeta = KeyExtended + 132
export const KeyRightShift = KeyExtended + 133
export const KeyRightAlt = KeyExtended + 134
export const KeyRightCtrl = KeyExtended + 135
export const KeyRightSuper = KeyExtended + 136
export const KeyRightHyper = KeyExtended + 137
export const KeyRightMeta = KeyExtended + 138
export const KeyIsoLevel3Shift = KeyExtended + 139
export const KeyIsoLevel5Shift = KeyExtended + 140

// Special names in C0.
export const KeyBackspace = 0x7F // DEL
export const KeyTab = 0x09 // HT
export const KeyEnter = 0x0D // CR
export const KeyReturn = KeyEnter
export const KeyEscape = 0x1B // ESC
export const KeyEsc = KeyEscape

// Special names in G0.
export const KeySpace = 0x20 // SP
