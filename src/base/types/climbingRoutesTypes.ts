export type ClimbingRouteStars = 1 | 2 | 3 | 4 | 5

export type ClimbingRouteGrade =
  | '4'
  | '5a'
  | '5a+'
  | '5b'
  | '5b+'
  | '5c'
  | '5c+'
  | '6a'
  | '6a+'
  | '6b'
  | '6+b'
  | '6c'
  | '6c+'
  | '7a'
  | '7a+'
  | '7b'
  | '7b+'
  | '7c'
  | '7c+'
  | '8a'

export type ClimbingRouteType = 'dalle' | 'verticale' | 'devers' | 'toit' | 'autre'

export enum ClimbingSpotEnum {
  PIC_ST_LOUP = 'Pic Saint-Loup',
  HORTUS = 'Hortus',
  VALFLAUNES = 'Valflaunès',
  CLARET = 'Claret',
  CAZEVIEILLE = 'Cazevieille',
  THAURAC = 'Thaurac',
  ST_BAUZILLE_PUTOIS = 'Saint-Bauzille-de-Putois',
  ST_GUILHEM = 'Saint-Guilhem-le-Désert',
  VERDUS = 'Verdus',
  ST_JEAN_BUEGES = 'Saint-Jean-de-Buèges',
  JONCAS = 'Le Joncas',
  SAUGRAS = 'Saugras',
  ST_BAUZILLE_MONTMEL = 'Saint-Bauzille-de-Montmel',
  COMBE_MURIERS = 'La Combe des Muriers',
  VISSOU = 'Pic de Vissou',
  MOUREZE = 'Cirque de Mourèze',
  CAROUX = 'Caroux',
  VIS = 'Gorges de la Vis',
  MOULIN_DE_BERTRAN = 'Moulin de Bertran',
}

export interface IClimbingRoute {
  facadeName: string
  climbingType: 'bloc' | 'falaise' | 'grande voie'
  routeName: string
  routeGrade: ClimbingRouteGrade
  routeProfile: ClimbingRouteType
  likedStars: ClimbingRouteStars
}

export interface IClimbingRouteLabelPayload {
  facadeName: string
  climbingType: 'bloc' | 'falaise' | 'grande voie'
  routeName: string
  routeGrade: ClimbingRouteGrade
  routeProfile?: ClimbingRouteType
  likedStars?: ClimbingRouteStars
}

export interface IClimbingRouteParsedLabel {
  facadeName: string
  climbingType: 'bloc' | 'falaise' | 'grande voie'
  routeName: string
  routeProfile: ClimbingRouteType
  likedStars: ClimbingRouteStars
  routeGrade: ClimbingRouteGrade
}

export type ClimbingRouteSuccessStatus = 'success' | 'fail'

export interface IClimbingRouteSummary {
  routeLabel: string
  successCount: number
  failCount: number
  lastAttemptAt: number
}
