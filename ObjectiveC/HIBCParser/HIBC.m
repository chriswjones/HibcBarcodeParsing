#import "HIBC.h"

@implementation HIBC

+ (BOOL)primaryHIBC:(HIBC *)primaryHIBC linksToSecondaryHIBC:(HIBC *)secondaryHIBC {
    if (primaryHIBC.checkCharacter
            && secondaryHIBC.linkCharacter
            && [primaryHIBC.checkCharacter isEqualToString:secondaryHIBC.linkCharacter]) {
        return YES;
    }

    return NO;
}

+ (HIBC *)decode:(NSString *)barcode {
    if (!barcode || [barcode length] == 0) {
        return nil;
    }

    /*
     Cleanup Barcode
     */
    barcode = [barcode stringByTrimmingCharactersInSet:[NSCharacterSet whitespaceAndNewlineCharacterSet]];;

    if ([barcode length] >= 1 && [[barcode substringToIndex:1] isEqualToString:@"*"]) {
        barcode = [barcode substringFromIndex:1];
    }

    if ([barcode length] >= 1 && [[barcode substringFromIndex:[barcode length] - 1] isEqualToString:@"*"]) {
        barcode = [barcode substringWithRange:NSMakeRange(0, [barcode length] - 1)];
    }


    /*
     Check if barcode is HIBC
     */

    if ([barcode length] > 1 && [[barcode substringToIndex:1] isEqualToString:@"+"]) {
        barcode = [barcode substringFromIndex:1];
    } else {
        return nil;
    }

    /*
     Is it a concatenated barcode?
     */
    if ([barcode length] < 4) {
        return nil;
    }
    // Remove and store last two characters.  These can contain "/" as a check character, or a link character. It will re-add them to the correct barcode later.
    NSString *lastTwo = [barcode substringWithRange:NSMakeRange([barcode length] - 2, 2)];
    barcode = [barcode substringToIndex:[barcode length] - 2];
    NSArray *array = [barcode componentsSeparatedByString:@"/"];

    /*
     Process barcode data
     */
    if ([array count] == 1) {

        // Standard Barcode - Product and Lot/Serial are on two different barcodeText labels

        NSString *barcodeData = [[array objectAtIndex:0] stringByAppendingString:lastTwo];
        NSCharacterSet *letters = [NSCharacterSet letterCharacterSet];
        NSCharacterSet *firstLetter = [NSCharacterSet characterSetWithCharactersInString:[barcodeData substringToIndex:1]];

        if ([letters isSupersetOfSet:firstLetter]) {
            return [HIBC hibcForPrimaryString:barcodeData barcodeType:BarcodeTypePrimary];
        } else {
            return [HIBC hibcForSecondaryString:barcodeData barcodeType:BarcodeTypeSecondary];
        }
    } else if ([array count] == 2) {

        // Concatenated Barcode - Product and Lot/Serial are on a single barcodeText separated by "/"

        HIBC *primary = [HIBC hibcForPrimaryString:[array objectAtIndex:0] barcodeType:BarcodeTypeConcatenated];
        HIBC *secondary = [HIBC hibcForSecondaryString:[[array objectAtIndex:1] stringByAppendingString:lastTwo] barcodeType:BarcodeTypeConcatenated];

        HIBC *hibc = [[HIBC alloc] init];
        hibc.barcodeType = BarcodeTypeConcatenated;
        hibc.labelerIDCode = primary.labelerIDCode;
        hibc.productNumber = primary.productNumber;
        hibc.unitOfMeasure = primary.unitOfMeasure;
        hibc.linkCharacter = secondary.linkCharacter;
        hibc.checkCharacter = secondary.checkCharacter;
        hibc.expirationDate = secondary.expirationDate;
        hibc.quantity = secondary.quantity;
        hibc.serial = secondary.serial;
        hibc.lot = secondary.lot;
        return hibc;
    } else {
        return nil;
    }
}

#pragma mark - Helpers

+ (HIBC *)hibcForPrimaryString:(NSString *)primary barcodeType:(enum BarcodeType)barcodeType {
    if ([primary length] < (barcodeType == BarcodeTypePrimary ? 6 : 7)) {
        return nil;
    }
    HIBC *hibc = [[HIBC alloc] init];
    hibc.barcodeType = barcodeType;
    hibc.labelerIDCode = [primary substringToIndex:4];
    primary = [primary substringFromIndex:4];
    hibc.productNumber = [primary substringToIndex:[primary length] - (barcodeType == BarcodeTypePrimary ? 2 : 1)];
    primary = [primary substringFromIndex:[primary length] - (barcodeType == BarcodeTypePrimary ? 2 : 1)];
    hibc.unitOfMeasure = [[primary substringToIndex:1] integerValue];
    if (barcodeType == BarcodeTypePrimary) {
        hibc.checkCharacter = [primary substringFromIndex:1];
    }
    return hibc;
}

+ (HIBC *)hibcForSecondaryString:(NSString *)secondary barcodeType:(enum BarcodeType)barcodeType {

    HIBC *hibc = [[HIBC alloc] init];
    hibc.barcodeType = barcodeType;

    NSCharacterSet *numbers = [NSCharacterSet decimalDigitCharacterSet];
    NSCharacterSet *alphanumeric = [NSCharacterSet alphanumericCharacterSet];
    NSCharacterSet *firstChar = [NSCharacterSet characterSetWithCharactersInString:[secondary substringToIndex:1]];
    NSCharacterSet *secondChar = [NSCharacterSet characterSetWithCharactersInString:[secondary substringWithRange:NSMakeRange(1, 1)]];
    NSCharacterSet *thirdChar = [NSCharacterSet characterSetWithCharactersInString:[secondary substringWithRange:NSMakeRange(2, 1)]];

    if ([numbers isSupersetOfSet:firstChar]) {
        // 5 digit Julian date
        NSDateFormatter *dateFormatter = [[NSDateFormatter alloc] init];
        dateFormatter.dateFormat = @"yyDDD";
        NSString *julianString = [secondary substringToIndex:5];
        hibc.expirationDate = [dateFormatter dateFromString:julianString];
        secondary = [secondary substringFromIndex:5];
        hibc.checkCharacter = [secondary substringWithRange:NSMakeRange([secondary length] - 1, 1)];
        if (barcodeType == BarcodeTypeSecondary) {
            hibc.linkCharacter = [secondary substringWithRange:NSMakeRange([secondary length] - 2, 1)];
            hibc.lot = [secondary substringWithRange:NSMakeRange(0, [secondary length] - 2)];
        }else {
            hibc.lot = [secondary substringWithRange:NSMakeRange(0, [secondary length] - 1)];
        }
    } else if ([[secondary substringToIndex:1] isEqualToString:@"$"] && [alphanumeric isSupersetOfSet:secondChar]) {
        hibc.checkCharacter = [secondary substringWithRange:NSMakeRange([secondary length] - 1, 1)];
        if (barcodeType == BarcodeTypeSecondary) {
            hibc.linkCharacter = [secondary substringWithRange:NSMakeRange([secondary length] - 2, 1)];
            hibc.lot = [secondary substringWithRange:NSMakeRange(1, [secondary length] - 3)];
        }else {
            hibc.lot = [secondary substringWithRange:NSMakeRange(1, [secondary length] - 2)];
        }
    } else if ([[secondary substringToIndex:2] isEqualToString:@"$+"] && [alphanumeric isSupersetOfSet:thirdChar]) {
        secondary = [secondary stringByReplacingOccurrencesOfString:@"$" withString:@""];
        secondary = [secondary stringByReplacingOccurrencesOfString:@"+" withString:@""];
        hibc.checkCharacter = [secondary substringWithRange:NSMakeRange([secondary length] - 1, 1)];
        if (barcodeType == BarcodeTypeSecondary) {
            hibc.linkCharacter = [secondary substringWithRange:NSMakeRange([secondary length] - 2, 1)];
            hibc.serial = [secondary substringWithRange:NSMakeRange(0, [secondary length] - 2)];
        }else {
            hibc.serial = [secondary substringWithRange:NSMakeRange(0, [secondary length] - 1)];
        }
    } else if ([[secondary substringToIndex:2] isEqualToString:@"$$"] && [alphanumeric isSupersetOfSet:thirdChar]) {
        secondary = [secondary stringByReplacingOccurrencesOfString:@"$" withString:@""];
        hibc.checkCharacter = [secondary substringWithRange:NSMakeRange([secondary length] - 1, 1)];

        if (barcodeType == BarcodeTypeSecondary) {
            hibc.linkCharacter = [secondary substringWithRange:NSMakeRange([secondary length] - 2, 1)];
            secondary = [secondary substringWithRange:NSMakeRange(0, [secondary length] - 2)];
        }else {
            secondary = [secondary substringWithRange:NSMakeRange(0, [secondary length] - 1)];
        }

        // quantity
        int i = [[secondary substringToIndex:1] intValue];
        BOOL noLot = NO;
        if (i == 8) {
            secondary = [secondary substringFromIndex:1];
            hibc.quantity = [[secondary substringToIndex:2] integerValue];
            secondary = [secondary substringFromIndex:2];
            if ([secondary length] == 0) {
                noLot = YES;
            }
        } else if (i == 9) {
            secondary = [secondary substringFromIndex:1];
            hibc.quantity = [[secondary substringToIndex:5] integerValue];
            secondary = [secondary substringFromIndex:5];

            if ([secondary length] == 0) {
                noLot = YES;
            }
        }

        if (!noLot) {
            hibc.expirationDate = [HIBC dateFromDateString:secondary];
            secondary = [HIBC substringFromDateString:secondary];
            hibc.lot = secondary;
        }

    } else if ([[secondary substringToIndex:3] isEqualToString:@"$$+"]) {
        secondary = [secondary stringByReplacingOccurrencesOfString:@"$" withString:@""];
        secondary = [secondary stringByReplacingOccurrencesOfString:@"+" withString:@""];
        hibc.checkCharacter = [secondary substringWithRange:NSMakeRange([secondary length] - 1, 1)];

        if (barcodeType == BarcodeTypeSecondary) {
            hibc.linkCharacter = [secondary substringWithRange:NSMakeRange([secondary length] - 2, 1)];
            secondary = [secondary substringWithRange:NSMakeRange(0, [secondary length] - 2)];
        }else {
            secondary = [secondary substringWithRange:NSMakeRange(0, [secondary length] - 1)];
        }

        hibc.expirationDate = [HIBC dateFromDateString:secondary];
        secondary = [HIBC substringFromDateString:secondary];
        hibc.serial = secondary;
    } else {
        return nil;
    }

    return hibc;
}

+ (NSDate *)dateFromDateString:(NSString *)string {
    NSDateFormatter *dateFormatter = [[NSDateFormatter alloc] init];
    int i = [[string substringToIndex:1] intValue];
    switch (i) {
        case 0:
        case 1: {
            NSString *dateString = [string substringToIndex:4];
            dateFormatter.dateFormat = @"MMyy";
            return [dateFormatter dateFromString:dateString];
        }
        case 2: {
            NSString *dateString = [string substringWithRange:NSMakeRange(1, 6)];
            dateFormatter.dateFormat = @"MMddyy";
            return [dateFormatter dateFromString:dateString];
        }
        case 3: {
            NSString *dateString = [string substringWithRange:NSMakeRange(1, 6)];
            dateFormatter.dateFormat = @"yyMMdd";
            return [dateFormatter dateFromString:dateString];
        }
        case 4: {
            NSString *dateString = [string substringWithRange:NSMakeRange(1, 8)];
            dateFormatter.dateFormat = @"yyMMddHH";
            return [dateFormatter dateFromString:dateString];
        }
        case 5: {
            NSString *dateString = [string substringWithRange:NSMakeRange(1, 5)];
            dateFormatter.dateFormat = @"yyDDD";
            return [dateFormatter dateFromString:dateString];
        }
        case 6: {
            NSString *dateString = [string substringWithRange:NSMakeRange(1, 7)];
            dateFormatter.dateFormat = @"yyDDDHH";
            return [dateFormatter dateFromString:dateString];
        }
        case 7: {
            return nil;
        }
        default:
            return nil;
    }
}

+ (NSString *)substringFromDateString:(NSString *)string {
    int i = [[string substringToIndex:1] intValue];
    switch (i) {
        case 0:
        case 1:
            return [string substringFromIndex:4];
        case 2:
            return [string substringFromIndex:7];
        case 3:
            return [string substringFromIndex:7];
        case 4:
            return [string substringFromIndex:9];
        case 5:
            return [string substringFromIndex:6];
        case 6:
            return [string substringFromIndex:8];
        case 7:
            return [string substringFromIndex:1];
        default:
            return @"";
    }
}

@end
