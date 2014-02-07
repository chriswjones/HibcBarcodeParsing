#import <Foundation/Foundation.h>

NS_ENUM(NSInteger, BarcodeType) {
    BarcodeTypeConcatenated,
    BarcodeTypePrimary,
    BarcodeTypeSecondary
};

@interface HIBC : NSObject
@property(nonatomic) enum BarcodeType barcodeType;
@property(nonatomic, strong) NSString *labelerIDCode;
@property(nonatomic, strong) NSString *productNumber;
@property(nonatomic) int unitOfMeasure;
@property(nonatomic, strong) NSString *checkCharacter;
@property(nonatomic, strong) NSString *linkCharacter;
@property(nonatomic, strong) NSDate *expirationDate;
@property(nonatomic) int quantity;
@property(nonatomic, strong) NSString *lot;
@property(nonatomic, strong) NSString *serial;

+ (HIBC *)decode:(NSString *)barcode;

+ (BOOL)primaryHIBC:(HIBC *)primaryHIBC linksToSecondaryHIBC:(HIBC *)secondaryHIBC;

@end